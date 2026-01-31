const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateApplication } = require('../middleware/validation');

router.post('/job/:jobId', authenticate, authorize('job_seeker', 'admin'), validateApplication, applicationController.applyToJob.bind(applicationController));
router.get('/my-applications', authenticate, authorize('job_seeker', 'admin'), applicationController.getJobSeekerApplications.bind(applicationController));
router.get('/job/:jobId', authenticate, authorize('recruiter', 'admin'), applicationController.getJobApplications.bind(applicationController));
router.get('/:id', authenticate, applicationController.getApplication.bind(applicationController));
router.patch('/:id/status', authenticate, authorize('recruiter', 'admin'), applicationController.updateApplicationStatus.bind(applicationController));

module.exports = router;

