const { getLogs } = require('../models/store');

function getLogsHandler(req, res) {
    res.json({ logs: getLogs() });
}

module.exports = { getLogs: getLogsHandler };
