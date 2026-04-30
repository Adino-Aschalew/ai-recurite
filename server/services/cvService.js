const pool = require('../config/database');
const cvParser = require('./cvParser');
const nlpService = require('./nlpService');
const aiScoringService = require('./aiScoringService');
const fs = require('fs').promises;
const path = require('path');

class CVService {
  /**
   * Upload and process CV
   */
  async uploadCV(jobSeekerId, file) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Parse CV
      if (!file || !file.path) {
        throw new Error('Uploaded file is missing or invalid');
      }
      const parsed = await cvParser.parseCV(file.path, file.mimetype);
      if (!parsed || !parsed.text) {
        throw new Error('CV parsing returned no text');
      }
      const cleanedText = cvParser.cleanText(parsed.text);
      const basicInfo = cvParser.extractBasicInfo(cleanedText);

      // Extract structured data using NLP
      const skills = nlpService.extractSkills(cleanedText);
      const experience = nlpService.extractExperience(cleanedText);
      const education = nlpService.extractEducation(cleanedText);

      const extractedData = {
        basicInfo,
        skills: skills.skills,
        experience,
        education,
        text: cleanedText
      };

      // Get current version
      const [currentCVs] = await connection.execute(
        'SELECT MAX(version) as max_version FROM cvs WHERE job_seeker_id = ?',
        [jobSeekerId]
      );

      const version = (currentCVs[0].max_version || 0) + 1;

      // Mark previous CVs as not current
      await connection.execute(
        'UPDATE cvs SET is_current = FALSE WHERE job_seeker_id = ?',
        [jobSeekerId]
      );

      // Save CV record
      const [result] = await connection.execute(
        `INSERT INTO cvs (job_seeker_id, file_name, file_path, file_type, file_size, version, is_current, extracted_data)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
        [
          jobSeekerId,
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          version,
          JSON.stringify(extractedData)
        ]
      );

      const cvId = result.insertId;

      await connection.commit();
      connection.release();

      // Prepare CV data for optional AI scoring/suggestions
      const cvData = {
        text: cleanedText,
        extractedData,
        skills: extractedData.skills || [],
        experience: extractedData.experience || { totalYears: 0 },
        education: extractedData.education || { highestDegree: null }
      };

      // If a jobId was provided (e.g., upload tied to a job), try to fetch job requirements
      let aiResult = null;
      try {
        let jobRequirements = null;
        // Do not assume there is a DB connection open here; use pool
        if (file && file.jobId) {
          const [jobs] = await pool.execute(
            `SELECT j.*, jr.* FROM jobs j LEFT JOIN job_requirements jr ON j.id = jr.job_id WHERE j.id = ?`,
            [file.jobId]
          );
          if (jobs.length > 0) {
            const job = jobs[0];
            jobRequirements = job.required_skills ? {
              required_skills: JSON.parse(job.required_skills),
              preferred_skills: JSON.parse(job.preferred_skills || '[]'),
              min_experience_years: job.min_experience_years,
              education_level: job.education_level
            } : null;
          }
        }

        // Fallback jobRequirements derived from the CV itself so AI can generate targeted suggestions
        if (!jobRequirements) {
          jobRequirements = {
            required_skills: cvData.skills.slice(0, 8),
            preferred_skills: [],
            min_experience_years: cvData.experience.totalYears || 0,
            education_level: cvData.education.highestDegree || 'Not specified'
          };
        }

        // Ask AI scoring service to score and generate suggestions (will fallback to rule-based if OpenAI not configured)
        aiResult = await aiScoringService.scoreCV(cvData, jobRequirements);
      } catch (err) {
        console.error('AI scoring on upload failed:', err.message);
      }

      return {
        id: cvId,
        version,
        extractedData,
        ai: aiResult
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('CV upload failed for file:', file && file.path, 'error:', error);
      // Add context to the error for easier debugging
      throw new Error(`CV upload failed: ${error.message}`);
    }
  }

  /**
   * Score CV against a job
   */
  async scoreCV(cvId, jobId) {
    // Get CV data
    const [cvs] = await pool.execute(
      'SELECT * FROM cvs WHERE id = ?',
      [cvId]
    );

    if (cvs.length === 0) {
      throw new Error('CV not found');
    }

    const cv = cvs[0];
    const extractedData = JSON.parse(cv.extracted_data || '{}');

    // Get job requirements
    const [jobs] = await pool.execute(
      `SELECT j.*, jr.* 
       FROM jobs j 
       LEFT JOIN job_requirements jr ON j.id = jr.job_id 
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      throw new Error('Job not found');
    }

    const job = jobs[0];
    const jobRequirements = job.required_skills ? {
      required_skills: JSON.parse(job.required_skills),
      preferred_skills: JSON.parse(job.preferred_skills || '[]'),
      min_experience_years: job.min_experience_years,
      education_level: job.education_level,
      required_certifications: JSON.parse(job.required_certifications || '[]')
    } : null;

    // Prepare CV data for scoring
    const cvData = {
      text: extractedData.text || '',
      extractedData,
      skills: extractedData.skills || [],
      experience: extractedData.experience || { totalYears: 0 },
      education: extractedData.education || { hasEducation: false }
    };

    // Score CV
    const scoreResult = await aiScoringService.scoreCV(cvData, jobRequirements);

    // Save score
    const [result] = await pool.execute(
      `INSERT INTO cv_scores 
       (cv_id, job_id, overall_score, skills_score, experience_score, education_score, quality_score, keyword_score, score_breakdown, ai_analysis, suggestions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cvId,
        jobId,
        scoreResult.overallScore,
        scoreResult.scores.skills,
        scoreResult.scores.experience,
        scoreResult.scores.education,
        scoreResult.scores.quality,
        scoreResult.scores.keyword,
        JSON.stringify(scoreResult.breakdown),
        JSON.stringify(scoreResult.aiAnalysis),
        scoreResult.suggestions.join('\n')
      ]
    );

    return {
      scoreId: result.insertId,
      ...scoreResult
    };
  }

  /**
   * Get CV with scores
   */
  async getCV(cvId, userId, userRole) {
    const [cvs] = await pool.execute(
      `SELECT c.*, js.user_id 
       FROM cvs c 
       JOIN job_seekers js ON c.job_seeker_id = js.id 
       WHERE c.id = ?`,
      [cvId]
    );

    if (cvs.length === 0) {
      const err = new Error('CV not found');
      err.statusCode = 404;
      throw err;
    }

    const cv = cvs[0];

    // Check access
    if (userRole !== 'admin' && userRole !== 'recruiter' && cv.user_id !== userId) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    // Get scores
    const [scores] = await pool.execute(
      `SELECT cs.*, j.title as job_title, j.company_name 
       FROM cv_scores cs 
       LEFT JOIN jobs j ON cs.job_id = j.id 
       WHERE cs.cv_id = ? 
       ORDER BY cs.created_at DESC`,
      [cvId]
    );

    return {
      ...cv,
      extracted_data: JSON.parse(cv.extracted_data || '{}'),
      scores: scores.map(s => ({
        ...s,
        score_breakdown: JSON.parse(s.score_breakdown || '{}'),
        ai_analysis: JSON.parse(s.ai_analysis || '{}')
      }))
    };
  }

  /**
   * Get all CVs for a job seeker
   */
  async getJobSeekerCVs(jobSeekerId) {
    const [cvs] = await pool.execute(
      `SELECT c.*, 
       (SELECT COUNT(*) FROM cv_scores WHERE cv_id = c.id) as score_count
       FROM cvs c 
       WHERE c.job_seeker_id = ? 
       ORDER BY c.created_at DESC`,
      [jobSeekerId]
    );

    return cvs.map(cv => ({
      ...cv,
      extracted_data: JSON.parse(cv.extracted_data || '{}')
    }));
  }

  /**
   * Get all CVs with search
   */
  async getAllCVs(search = '') {
    let query = `
      SELECT c.*, u.first_name, u.last_name, u.email
      FROM cvs c
      JOIN job_seekers js ON c.job_seeker_id = js.id
      JOIN users u ON js.user_id = u.id
      WHERE c.is_current = TRUE
    `;
    
    const params = [];
    if (search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR c.extracted_data LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const [cvs] = await pool.execute(query, params);
    return cvs.map(cv => ({
      ...cv,
      extracted_data: JSON.parse(cv.extracted_data || '{}')
    }));
  }

  /**
   * Delete CV
   */
  async deleteCV(cvId, userId, userRole) {
    // Check access
    const [cvs] = await pool.execute(
      `SELECT c.*, js.user_id 
       FROM cvs c 
       JOIN job_seekers js ON c.job_seeker_id = js.id 
       WHERE c.id = ?`,
      [cvId]
    );

    if (cvs.length === 0) {
      throw new Error('CV not found');
    }

    if (userRole !== 'admin' && cvs[0].user_id !== userId) {
      throw new Error('Access denied');
    }

    // Delete file
    try {
      await fs.unlink(cvs[0].file_path);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await pool.execute('DELETE FROM cvs WHERE id = ?', [cvId]);

    return { success: true };
  }
}

module.exports = new CVService();

