const express = require('express');
const requireAuth = require('../middleware/auth');
const { getStatus, controlGate, getPendingCommand, reportStatus } = require('../controllers/gateController');

const router = express.Router();
router.get('/status', requireAuth, getStatus);
router.post('/control', requireAuth, controlGate);
router.post('/esp32/report', reportStatus);
router.get('/esp32/command', getPendingCommand);

module.exports = router;
