const { logs } = require('../models/store');

function getLogs(req, res) {
    res.json({ logs });
}

module.exports = { getLogs };
