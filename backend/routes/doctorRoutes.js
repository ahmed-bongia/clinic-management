const express = require('express');
const { getAllDoctors } = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllDoctors);

module.exports = router;
