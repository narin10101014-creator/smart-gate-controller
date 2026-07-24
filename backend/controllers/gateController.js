const { gateState, addLog } = require('../models/store');

function getStatus(req, res) {
    res.json({ gate: gateState });
}

function controlGate(req, res) {
    const { action } = req.body;
    if (!['open', 'close', 'toggle'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
    }

    if (action === 'toggle') {
        gateState.status = gateState.status === 'open' ? 'closed' : 'open';
    } else {
        gateState.status = action === 'open' ? 'open' : 'closed';
    }
    gateState.updatedAt = new Date().toISOString();

    addLog({ type: 'control', user: req.user.username, message: `Gate ${gateState.status}` });
    res.json({ gate: gateState });
}

function reportStatus(req, res) {
    const { status } = req.body;
    if (!status || !['open', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    gateState.status = status;
    gateState.updatedAt = new Date().toISOString();
    addLog({ type: 'device', user: 'ESP32', message: `ESP32 reported ${status}` });
    res.json({ gate: gateState });
}

module.exports = { getStatus, controlGate, reportStatus };
