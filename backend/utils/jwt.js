const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwtSecret;
};

const isJwtSecretConfigured = () => Boolean(process.env.JWT_SECRET?.trim());

/**
 * Generate JWT token
 * @param {object} payload - User info (id, role, email)
 * @returns {string} Signed JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

/**
 * Verify JWT token
 * @param {string} token - Signed JWT
 * @returns {object|null} Decoded payload or null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  isJwtSecretConfigured,
  verifyToken
};
