const { errorResponse } = require('../utils/response');
const { SYSTEM_ROLES } = require('../utils/roles');

/**
 * Middleware to enforce role-based access controls
 * @param {string[]} allowedRoles - List of authorized roles
 */
const roleMiddleware = (allowedRoles) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.some((role) => !SYSTEM_ROLES.includes(role))) {
    throw new Error('Role middleware received an invalid role policy.');
  }

  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before checking roles.', 401);
    }

    if (!SYSTEM_ROLES.includes(req.user.role) || !allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden.', 403);
    }

    next();
  };
};

module.exports = roleMiddleware;
