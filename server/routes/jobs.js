const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateJobCreate } = require('../middleware/validation');

router.post('/', authenticate, authorize('recruiter', 'admin'), validateJobCreate, jobController.createJob.bind(jobController));
router.get('/', authenticate, jobController.getJobs.bind(jobController));
router.get('/:id', authenticate, jobController.getJob.bind(jobController));
router.get('/:id/candidates', authenticate, authorize('recruiter', 'admin'), jobController.getRankedCandidates.bind(jobController));
router.get('/:jobId/interview-questions/:cvId', authenticate, authorize('recruiter', 'admin'), jobController.generateInterviewQuestions.bind(jobController));
router.patch('/:id/status', authenticate, authorize('recruiter', 'admin'), jobController.updateJobStatus.bind(jobController));
router.delete('/:id', authenticate, authorize('recruiter', 'admin'), jobController.deleteJob.bind(jobController));

module.exports = router;

