const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('role').isIn(['job_seeker', 'recruiter']),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
];

// CV upload validation
const validateCVUpload = [
  body('jobSeekerId').optional().isInt(),
  handleValidationErrors
];

// Job creation validation
const validateJobCreate = [
  body('title').trim().isLength({ min: 3, max: 255 }),
  body('description').trim().isLength({ min: 10 }),
  body('companyName').trim().isLength({ min: 2, max: 255 }),
  body('location').optional().trim(),
  body('employmentType').optional().isIn(['full-time', 'part-time', 'contract', 'internship']),
  handleValidationErrors
];

// Application validation
const validateApplication = [
  param('jobId').isInt(),
  body('cvId').isInt(),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCVUpload,
  validateJobCreate,
  validateApplication,
  handleValidationErrors
};

