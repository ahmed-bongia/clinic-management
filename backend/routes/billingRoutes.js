const express = require('express');
const { getAllInvoices } = require('../controllers/billingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllInvoices);

module.exports = router;
