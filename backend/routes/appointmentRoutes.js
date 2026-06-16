const express = require('express');
const { getAllAppointments, createAppointment, deleteAppointment } = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllAppointments);
router.post('/', authMiddleware, createAppointment);
router.delete('/:id', authMiddleware, deleteAppointment);

module.exports = router;
