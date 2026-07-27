const { getSession } = require('../models/store');

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const session = token ? getSession(token) : null;
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = session;
    next();
}

module.exports = requireAuth;
