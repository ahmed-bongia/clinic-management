const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');

/**
 * Authentication middleware that verifies the Bearer JWT token
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access denied. No authentication token provided.', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return errorResponse(res, 'Invalid or expired authentication token.', 401);
  }

  // Bind decoded payload (id, email, role, name) to request object
  req.user = decoded;
  next();
};

module.exports = authMiddleware;
