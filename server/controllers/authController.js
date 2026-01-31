const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, role, ...profileData } = req.body;
      const result = await authService.register(email, password, role, profileData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      // User profile is already in req.user from auth middleware
      res.json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

