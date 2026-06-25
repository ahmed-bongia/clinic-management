const { errorResponse } = require('../utils/response');

/**
 * Global Express error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err);

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode >= 500 ? 'An internal server error occurred.' : (err.message || 'Request failed.');

  return errorResponse(res, message, statusCode);
};

module.exports = errorMiddleware;
