const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async getRecruiterAnalytics(req, res, next) {
    try {
      const recruiterId = await this.getRecruiterId(req.user.id);
      if (!recruiterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const dateRange = {
        start: req.query.startDate || null,
        end: req.query.endDate || null
      };

      const result = await analyticsService.getRecruiterAnalytics(recruiterId, dateRange);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobAnalytics(req, res, next) {
    try {
      const { jobId } = req.params;
      const recruiterId = await this.getRecruiterId(req.user.id);
      if (!recruiterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await analyticsService.getJobAnalytics(parseInt(jobId), recruiterId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async exportApplicationsReport(req, res, next) {
    try {
      const { jobId } = req.params;
      const { format } = req.query;
      const recruiterId = await this.getRecruiterId(req.user.id);
      if (!recruiterId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await analyticsService.exportApplicationsReport(
        parseInt(jobId),
        recruiterId,
        format || 'csv'
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=applications-${jobId}.csv`);
        res.send(result);
      } else {
        res.json(result);
      }
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

module.exports = new AnalyticsController();

