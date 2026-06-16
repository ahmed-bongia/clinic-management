const express = require('express');
const { getAllPatients, createPatient } = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllPatients);
router.post('/', authMiddleware, createPatient);

module.exports = router;
