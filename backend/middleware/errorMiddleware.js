const { errorResponse } = require('../utils/response');

/**
 * Global Express error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An internal server error occurred.';
  const details = process.env.NODE_ENV === 'development' ? err.stack : null;

  return errorResponse(res, message, statusCode, details);
};

module.exports = errorMiddleware;
