const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to intercept and format validation errors
 */
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'Invalid input arguments. Please correct errors and try again.',
      400,
      errors.array().map(err => ({ field: err.path, message: err.msg }))
    );
  }
  
  next();
};

module.exports = validationMiddleware;
