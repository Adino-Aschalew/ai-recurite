const pool = require('../config/database');
const cvService = require('./cvService');

class JobService {
  /**
   * Create a new job posting
   */
  async createJob(recruiterId, jobData) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create job (include posted_at immediately when status is active)
      const isActiveOnCreate = (jobData.status || 'draft') === 'active';
      let insertQuery = `INSERT INTO jobs 
         (recruiter_id, title, description, company_name, location, employment_type, salary_min, salary_max, currency, status${isActiveOnCreate ? ', posted_at' : ''})
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?${isActiveOnCreate ? ', NOW()' : ''})`;

      const insertParams = [
        recruiterId,
        jobData.title,
        jobData.description,
        jobData.companyName,
        jobData.location || null,
        jobData.employmentType || null,
        jobData.salaryMin || null,
        jobData.salaryMax || null,
        jobData.currency || 'USD',
        jobData.status || 'draft'
      ];

      const [jobResult] = await connection.execute(insertQuery, insertParams);

      const jobId = jobResult.insertId;

      // Create job requirements
      if (jobData.requirements) {
        await connection.execute(
          `INSERT INTO job_requirements 
           (job_id, required_skills, preferred_skills, min_experience_years, education_level, required_certifications, other_requirements)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            jobId,
            JSON.stringify(jobData.requirements.requiredSkills || []),
            JSON.stringify(jobData.requirements.preferredSkills || []),
            jobData.requirements.minExperienceYears || null,
            jobData.requirements.educationLevel || null,
            JSON.stringify(jobData.requirements.requiredCertifications || []),
            jobData.requirements.otherRequirements || null
          ]
        );
      }

      // If job is published immediately, set posted_at
      if ((jobData.status || 'draft') === 'active') {
        await connection.execute(
          'UPDATE jobs SET posted_at = NOW() WHERE id = ?',
          [jobId]
        );
      }

      await connection.commit();
      connection.release();

      return await this.getJob(jobId);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    const [jobs] = await pool.execute(
      `SELECT j.*, jr.*, r.company_name as recruiter_company
       FROM jobs j
       LEFT JOIN job_requirements jr ON j.id = jr.job_id
       LEFT JOIN recruiters r ON j.recruiter_id = r.id
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      throw new Error('Job not found');
    }

    const job = jobs[0];
    return {
      ...job,
      required_skills: job.required_skills ? JSON.parse(job.required_skills) : [],
      preferred_skills: job.preferred_skills ? JSON.parse(job.preferred_skills || '[]') : [],
      required_certifications: job.required_certifications ? JSON.parse(job.required_certifications || '[]') : []
    };
  }

  /**
   * Get all jobs (with filters)
   */
  async getJobs(filters = {}) {
    let query = `
      SELECT j.*, jr.required_skills, jr.min_experience_years,
             (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
      FROM jobs j
      LEFT JOIN job_requirements jr ON j.id = jr.job_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND j.status = ?';
      params.push(filters.status);
    }

    if (filters.recruiterId) {
      query += ' AND j.recruiter_id = ?';
      params.push(filters.recruiterId);
    }

    if (filters.search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.company_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY j.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const [jobs] = await pool.execute(query, params);

    return jobs.map(job => ({
      ...job,
      required_skills: job.required_skills ? JSON.parse(job.required_skills) : []
    }));
  }

  /**
   * Get ranked candidates for a job
   */
  async getRankedCandidates(jobId, recruiterId) {
    // Verify job belongs to recruiter
    const [jobs] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      throw new Error('Job not found or access denied');
    }

    // Get all applications with scores
    const [applications] = await pool.execute(
      `SELECT 
        a.*,
        js.first_name, js.last_name, js.email,
        c.file_name, c.version,
        cs.overall_score, cs.skills_score, cs.experience_score,
        cs.score_breakdown, cs.suggestions
       FROM applications a
       JOIN job_seekers js ON a.job_seeker_id = js.id
       JOIN cvs c ON a.cv_id = c.id
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE a.job_id = ?
       ORDER BY cs.overall_score DESC, a.applied_at DESC`,
      [jobId]
    );

    return applications.map(app => ({
      ...app,
      score_breakdown: app.score_breakdown ? JSON.parse(app.score_breakdown) : null
    }));
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status, recruiterId) {
    // Verify ownership
    const [jobs] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      throw new Error('Job not found or access denied');
    }

    const updateData = { status };
    if (status === 'active') {
      updateData.posted_at = new Date();
    } else if (status === 'closed') {
      updateData.closed_at = new Date();
    }

    await pool.execute(
      `UPDATE jobs 
       SET status = ?, ${status === 'active' ? 'posted_at = NOW(),' : ''} ${status === 'closed' ? 'closed_at = NOW(),' : ''} updated_at = NOW()
       WHERE id = ?`,
      [status, jobId]
    );

    return await this.getJob(jobId);
  }

  /**
   * Delete job
   */
  async deleteJob(jobId, recruiterId) {
    // Verify ownership
    const [jobs] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      throw new Error('Job not found or access denied');
    }

    await pool.execute('DELETE FROM jobs WHERE id = ?', [jobId]);
    return { success: true };
  }
}

module.exports = new JobService();

