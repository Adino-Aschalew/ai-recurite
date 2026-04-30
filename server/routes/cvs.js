const express = require('express');
const router = express.Router();
const { controller: cvController, upload } = require('../controllers/cvController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.post('/upload', authenticate, authorize('job_seeker', 'admin'), uploadLimiter, upload, cvController.uploadCV.bind(cvController));
// Temporary test-only upload (no auth) for local verification only
router.post('/upload-test', upload, cvController.uploadCVTest.bind(cvController));
router.post('/:cvId/score/:jobId', authenticate, cvController.scoreCV.bind(cvController));
// Place specific routes before parameterized ones so they are not captured by `:id`
router.get('/all', authenticate, authorize('recruiter', 'admin'), cvController.getAllCVs.bind(cvController));
router.get('/job-seeker', authenticate, cvController.getJobSeekerCVs.bind(cvController));
router.get('/job-seeker/:jobSeekerId', authenticate, cvController.getJobSeekerCVs.bind(cvController));
router.get('/:id', authenticate, cvController.getCV.bind(cvController));
router.delete('/:id', authenticate, cvController.deleteCV.bind(cvController));

module.exports = router;

