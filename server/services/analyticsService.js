const pool = require('../config/database');
const aiScoringService = require('./aiScoringService');

class AnalyticsService {
  /**
   * Get recruiter analytics dashboard
   */
  async getRecruiterAnalytics(recruiterId, dateRange = {}) {
    const startDate = dateRange.start || '1970-01-01';
    const endDate = dateRange.end || new Date().toISOString().split('T')[0];

    // Total jobs
    const [jobStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_jobs
       FROM jobs
       WHERE recruiter_id = ? AND created_at BETWEEN ? AND ?`,
      [recruiterId, startDate, endDate]
    );

    // Total applications
    const [appStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN a.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
        SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        AVG(cs.overall_score) as avg_cv_score
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE j.recruiter_id = ? AND a.applied_at BETWEEN ? AND ?`,
      [recruiterId, startDate, endDate]
    );

    // Top candidates
    // Top candidates: include user email by joining users table
    const [topCandidates] = await pool.execute(
      `SELECT 
        js.first_name, js.last_name, u.email,
        cs.overall_score,
        COUNT(DISTINCT a.job_id) as applications_count
       FROM applications a
       JOIN job_seekers js ON a.job_seeker_id = js.id
       JOIN users u ON js.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE j.recruiter_id = ? AND a.applied_at BETWEEN ? AND ?
       GROUP BY js.id, js.first_name, js.last_name, u.email, cs.overall_score
       ORDER BY cs.overall_score DESC
       LIMIT 10`,
      [recruiterId, startDate, endDate]
    );

    // Applications by status
    const [statusBreakdown] = await pool.execute(
      `SELECT 
        a.status,
        COUNT(*) as count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.recruiter_id = ? AND a.applied_at BETWEEN ? AND ?
       GROUP BY a.status`,
      [recruiterId, startDate, endDate]
    );

    // Skill gaps analysis
    const [skillGaps] = await pool.execute(
      `SELECT 
        jr.required_skills,
        COUNT(DISTINCT a.id) as application_count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN job_requirements jr ON j.id = jr.job_id
       WHERE j.recruiter_id = ? AND a.applied_at BETWEEN ? AND ?
       GROUP BY jr.required_skills`,
      [recruiterId, startDate, endDate]
    );

    return {
      jobs: jobStats[0],
      applications: appStats[0],
      topCandidates,
      statusBreakdown,
      skillGaps: skillGaps.map(sg => ({
        ...sg,
        required_skills: JSON.parse(sg.required_skills || '[]')
      }))
    };
  }

  /**
   * Get job-specific analytics
   */
  async getJobAnalytics(jobId, recruiterId) {
    // Verify access
    const [jobs] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      throw new Error('Job not found or access denied');
    }

    // Application stats
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_applicants,
        AVG(cs.overall_score) as avg_score,
        MAX(cs.overall_score) as max_score,
        MIN(cs.overall_score) as min_score,
        SUM(CASE WHEN a.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted_count
       FROM applications a
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE a.job_id = ?`,
      [jobId]
    );

    // Score distribution
    const [scoreDistribution] = await pool.execute(
      `SELECT 
        CASE 
          WHEN cs.overall_score >= 80 THEN '80-100'
          WHEN cs.overall_score >= 60 THEN '60-79'
          WHEN cs.overall_score >= 40 THEN '40-59'
          ELSE '0-39'
        END as score_range,
        COUNT(*) as count
       FROM applications a
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE a.job_id = ?
       GROUP BY score_range
       ORDER BY score_range DESC`,
      [jobId]
    );

    return {
      ...stats[0],
      scoreDistribution
    };
  }

  /**
   * Export applications report
   */
  async exportApplicationsReport(jobId, recruiterId, format = 'csv') {
    const applications = await pool.execute(
      `SELECT 
        a.id,
        js.first_name,
        js.last_name,
        u.email,
        js.phone,
        cs.overall_score,
        cs.skills_score,
        cs.experience_score,
        cs.education_score,
        a.status,
        a.applied_at
       FROM applications a
       JOIN job_seekers js ON a.job_seeker_id = js.id
       JOIN users u ON js.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN cv_scores cs ON a.cv_score_id = cs.id
       WHERE j.id = ? AND j.recruiter_id = ?
       ORDER BY cs.overall_score DESC`,
      [jobId, recruiterId]
    );

    if (format === 'csv') {
      return this.formatAsCSV(applications[0]);
    }

    return applications[0];
  }

  formatAsCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

module.exports = new AnalyticsService();

