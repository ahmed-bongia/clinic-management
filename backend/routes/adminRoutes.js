const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  createUser,
  getActiveStaff,
  getDashboardMetrics,
  getUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus
} = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['Admin']));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get live Admin dashboard summary metrics
 * @access  Admin
 */
router.get('/dashboard', getDashboardMetrics);
router.get('/dashboard/metrics', getDashboardMetrics);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/password', resetUserPassword);
router.get('/staff/active', getActiveStaff);

module.exports = router;
