const { getGateState, setGateState, addLog, setPendingCommand, takePendingCommand } = require('../models/store');

function getStatus(req, res) {
    res.json({ gate: getGateState() });
}

function controlGate(req, res) {
    const { action } = req.body;
    if (!['open', 'close', 'toggle'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
    }

    const direction = action === 'toggle'
        ? (getGateState().status === 'open' ? 'close' : 'open')
        : action;

    setPendingCommand(direction);

    addLog({ type: 'control', user: req.user.username, message: `Gate ${direction} requested` });
    res.json({ gate: getGateState() });
}

function getPendingCommand(req, res) {
    res.json({ command: takePendingCommand() });
}

function reportStatus(req, res) {
    const { status } = req.body;
    if (!status || !['open', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    setGateState(status);
    addLog({ type: 'device', user: 'ESP32', message: `ESP32 reported ${status}` });
    res.json({ gate: getGateState() });
}

module.exports = { getStatus, controlGate, getPendingCommand, reportStatus };
