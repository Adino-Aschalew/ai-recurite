const applicationService = require('../services/applicationService');

class ApplicationController {
  async applyToJob(req, res, next) {
    try {
      const { jobId } = req.params;
      const { cvId } = req.body;

      const jobSeekerId = await this.getJobSeekerId(req.user.id);
      if (!jobSeekerId) {
        return res.status(400).json({ error: 'Job seeker profile not found' });
      }

      const result = await applicationService.applyToJob(
        parseInt(jobId),
        jobSeekerId,
        parseInt(cvId)
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateApplicationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const recruiterId = await this.getRecruiterId(req.user.id);
      if (!recruiterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await applicationService.updateApplicationStatus(
        parseInt(id),
        status,
        recruiterId,
        notes
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getApplication(req, res, next) {
    try {
      const { id } = req.params;
      const result = await applicationService.getApplication(parseInt(id));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobSeekerApplications(req, res, next) {
    try {
      const jobSeekerId = await this.getJobSeekerId(req.user.id);
      if (!jobSeekerId) {
        return res.status(400).json({ error: 'Job seeker profile not found' });
      }

      const result = await applicationService.getJobSeekerApplications(jobSeekerId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobApplications(req, res, next) {
    try {
      const { jobId } = req.params;
      const recruiterId = await this.getRecruiterId(req.user.id);
      if (!recruiterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await applicationService.getJobApplications(parseInt(jobId), recruiterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobSeekerId(userId) {
    const pool = require('../config/database');
    const [seekers] = await pool.execute(
      'SELECT id FROM job_seekers WHERE user_id = ?',
      [userId]
    );
    return seekers.length > 0 ? seekers[0].id : null;
  }

  async getRecruiterId(userId) {
    const pool = require('../config/database');
    const [recruiters] = await pool.execute(
      'SELECT id FROM recruiters WHERE user_id = ?',
      [userId]
    );
    return recruiters.length > 0 ? recruiters[0].id : null;
  }
}

module.exports = new ApplicationController();

