const jobService = require('../services/jobService');
const aiScoringService = require('../services/aiScoringService');

class JobController {
  async createJob(req, res, next) {
    try {
      let recruiterId;
      if (req.user.role === 'admin' && req.body.recruiterId) {
        recruiterId = parseInt(req.body.recruiterId, 10);
      } else {
        recruiterId = await this.getRecruiterId(req.user.id);
      }

      if (!recruiterId) {
        return res.status(400).json({ error: 'Recruiter profile not found' });
      }

      const result = await jobService.createJob(recruiterId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJob(req, res, next) {
    try {
      const { id } = req.params;
      const result = await jobService.getJob(parseInt(id));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobs(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        recruiterId: req.user.role === 'recruiter' ? await this.getRecruiterId(req.user.id) : null,
        search: req.query.search,
        limit: req.query.limit ? parseInt(req.query.limit) : null,
        offset: req.query.offset ? parseInt(req.query.offset) : null
      };

      const result = await jobService.getJobs(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getRankedCandidates(req, res, next) {
    try {
      const { id } = req.params;
      const recruiterId = await this.getRecruiterId(req.user.id);
      if (!recruiterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await jobService.getRankedCandidates(parseInt(id), recruiterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateJobStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const recruiterId = await this.getRecruiterId(req.user.id);
      if (!recruiterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await jobService.updateJobStatus(parseInt(id), status, recruiterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteJob(req, res, next) {
    try {
      const { id } = req.params;
      const recruiterId = await this.getRecruiterId(req.user.id);
      if (!recruiterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await jobService.deleteJob(parseInt(id), recruiterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async generateInterviewQuestions(req, res, next) {
    try {
      const { jobId, cvId } = req.params;
      
      // Get CV and job data
      const cvService = require('../services/cvService');
      const cv = await cvService.getCV(parseInt(cvId), req.user.id, req.user.role);
      const job = await jobService.getJob(parseInt(jobId));

      const cvData = {
        skills: cv.extracted_data.skills || [],
        experience: cv.extracted_data.experience || { totalYears: 0 },
        education: cv.extracted_data.education || {}
      };

      const jobRequirements = {
        required_skills: job.required_skills || [],
        preferred_skills: job.preferred_skills || []
      };

      const questions = await aiScoringService.generateInterviewQuestions(cvData, jobRequirements);
      res.json({ questions });
    } catch (error) {
      next(error);
    }
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

module.exports = new JobController();

