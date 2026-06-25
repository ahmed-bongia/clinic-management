const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { body } = require('express-validator');
const { login, register, getCurrentUser, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const { loginValidators, registerValidators } = require('../validators/requestValidators');

const router = express.Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again in 15 minutes.'
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post(
  '/login',
  loginRateLimiter,
  loginValidators,
  validationMiddleware,
  login
);

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  registerValidators,
  validationMiddleware,
  register
);

/**
 * @route GET /api/auth/me
 * @desc Retrieve current logged-in user profile
 * @access Private
 */
router.get('/me', authMiddleware, getCurrentUser);
router.patch('/change-password', authMiddleware, changePassword);

module.exports = router;
