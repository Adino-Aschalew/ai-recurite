const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

class AuthService {
  /**
   * Register a new user
   */
  async register(email, password, role, profileData) {
    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Get role ID
    const [roles] = await pool.execute(
      'SELECT id FROM roles WHERE name = ?',
      [role]
    );

    if (roles.length === 0) {
      throw new Error('Invalid role');
    }

    const roleId = roles[0].id;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      const [result] = await connection.execute(
        'INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)',
        [email, passwordHash, roleId]
      );

      const userId = result.insertId;

      // Create profile based on role
      if (role === 'job_seeker') {
        await connection.execute(
          `INSERT INTO job_seekers (user_id, first_name, last_name, phone, location, linkedin_url, portfolio_url, bio)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            profileData.firstName || '',
            profileData.lastName || '',
            profileData.phone || null,
            profileData.location || null,
            profileData.linkedinUrl || null,
            profileData.portfolioUrl || null,
            profileData.bio || null
          ]
        );
      } else if (role === 'recruiter') {
        await connection.execute(
          `INSERT INTO recruiters (user_id, company_name, first_name, last_name, phone, department)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            profileData.companyName || '',
            profileData.firstName || '',
            profileData.lastName || '',
            profileData.phone || null,
            profileData.department || null
          ]
        );
      }

      await connection.commit();
      connection.release();

      // Generate token
      const token = this.generateToken(userId);

      return {
        token,
        user: {
          id: userId,
          email,
          role
        }
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    const [users] = await pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ? AND u.is_active = TRUE`,
      [email]
    );

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role_name
      }
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set. Please set JWT_SECRET in your environment or .env file.');
    }

    return jwt.sign(
      { userId },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set. Cannot verify token without JWT_SECRET.');
    }
    return jwt.verify(token, secret);
  }
}

module.exports = new AuthService();

