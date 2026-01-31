const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/recruiter', authenticate, authorize('recruiter', 'admin'), analyticsController.getRecruiterAnalytics.bind(analyticsController));
router.get('/job/:jobId', authenticate, authorize('recruiter', 'admin'), analyticsController.getJobAnalytics.bind(analyticsController));
router.get('/job/:jobId/export', authenticate, authorize('recruiter', 'admin'), analyticsController.exportApplicationsReport.bind(analyticsController));

module.exports = router;

