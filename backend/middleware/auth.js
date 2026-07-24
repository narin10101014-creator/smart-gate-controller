const { sessions } = require('../models/store');

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token || !sessions[token]) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = sessions[token];
    next();
}

module.exports = requireAuth;
