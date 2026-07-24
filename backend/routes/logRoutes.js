const express = require('express');
const requireAuth = require('../middleware/auth');
const { getLogs } = require('../controllers/logController');

const router = express.Router();
router.get('/logs', requireAuth, getLogs);

module.exports = router;
