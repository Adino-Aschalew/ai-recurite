const pool = require('../config/database');
const cvService = require('./cvService');

class ApplicationService {
  /**
   * Apply to a job
   */
  async applyToJob(jobId, jobSeekerId, cvId) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if already applied
      const [existing] = await connection.execute(
        'SELECT id FROM applications WHERE job_id = ? AND job_seeker_id = ?',
        [jobId, jobSeekerId]
      );

      if (existing.length > 0) {
        throw new Error('Already applied to this job');
      }

      // Score CV against job
      const scoreResult = await cvService.scoreCV(cvId, jobId);

      // Create application
      const [result] = await connection.execute(
        `INSERT INTO applications (job_id, job_seeker_id, cv_id, cv_score_id, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [jobId, jobSeekerId, cvId, scoreResult.scoreId]
      );

      await connection.commit();
      connection.release();

      return {
        id: result.insertId,
        score: scoreResult.overallScore,
        status: 'pending'
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId, status, recruiterId, notes = null) {
    // Verify recruiter has access to this application's job
    const [applications] = await pool.execute(
      `SELECT a.*, j.recruiter_id 
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (applications.length === 0) {
      throw new Error('Application not found');
    }

    if (applications[0].recruiter_id !== recruiterId) {
      throw new Error('Access denied');
    }

    await pool.execute(
      `UPDATE applications 
       SET status = ?, recruiter_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, notes, applicationId]
    );

    return await this.getApplication(applicationId);
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId) {
    const [applications] = await pool.execute(
      `SELECT a.*, 
       js.first_name, js.last_name, js.email, js.phone,
       j.title as job_title, j.company_name,
       c.file_name, c.version,
       cs.overall_score, cs.score_breakdown, cs.suggestions
       FROM applications a
       JOIN job_seekers js ON a.job_seeker_id = js.id
       JOIN jobs j ON a.job_id = j.id
       JOIN cvs c ON a.cv_id = c.id
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (applications.length === 0) {
      throw new Error('Application not found');
    }

    const app = applications[0];
    return {
      ...app,
      score_breakdown: app.score_breakdown ? JSON.parse(app.score_breakdown) : null
    };
  }

  /**
   * Get applications for a job seeker
   */
  async getJobSeekerApplications(jobSeekerId) {
    const [applications] = await pool.execute(
      `SELECT a.*, 
       j.title, j.company_name, j.status as job_status,
       cs.overall_score
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE a.job_seeker_id = ?
       ORDER BY a.applied_at DESC`,
      [jobSeekerId]
    );

    return applications;
  }

  /**
   * Get applications for a job (recruiter view)
   */
  async getJobApplications(jobId, recruiterId) {
    // Verify access
    const [jobs] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      throw new Error('Job not found or access denied');
    }

    const [applications] = await pool.execute(
      `SELECT a.*,
       js.first_name, js.last_name, js.email,
       cs.overall_score, cs.skills_score, cs.experience_score
       FROM applications a
       JOIN job_seekers js ON a.job_seeker_id = js.id
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE a.job_id = ?
       ORDER BY cs.overall_score DESC, a.applied_at DESC`,
      [jobId]
    );

    return applications;
  }
}

module.exports = new ApplicationService();

