const express = require('express');
const requireAuth = require('../middleware/auth');
const { getStatus, controlGate, reportStatus } = require('../controllers/gateController');

const router = express.Router();
router.get('/status', requireAuth, getStatus);
router.post('/control', requireAuth, controlGate);
router.post('/esp32/report', reportStatus);

module.exports = router;
