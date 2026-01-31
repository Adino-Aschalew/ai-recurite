const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validateRegister, authController.register.bind(authController));
router.post('/login', authLimiter, validateLogin, authController.login.bind(authController));
router.get('/profile', authenticate, authController.getProfile.bind(authController));

module.exports = router;

