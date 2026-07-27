const bcrypt = require('bcryptjs');
const { users, addLog, createSession, deleteSession } = require('../models/store');

async function login(req, res) {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createSession(user);
    addLog({ type: 'login', user: user.username, message: 'User logged in' });
    res.json({ token, user: { username: user.username, role: user.role } });
}

function logout(req, res) {
    const token = req.headers['authorization'].slice(7);
    addLog({ type: 'logout', user: req.user.username, message: 'User logged out' });
    deleteSession(token);
    res.json({ message: 'Logged out' });
}

module.exports = { login, logout };
