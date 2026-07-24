const { users, sessions, addLog } = require('../models/store');
const { v4: uuidv4 } = require('uuid');

function login(req, res) {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = uuidv4();
    sessions[token] = { id: user.id, username: user.username, role: user.role };
    addLog({ type: 'login', user: user.username, message: 'User logged in' });
    res.json({ token, user: { username: user.username, role: user.role } });
}

function logout(req, res) {
    const token = req.headers['authorization'].slice(7);
    addLog({ type: 'logout', user: req.user.username, message: 'User logged out' });
    delete sessions[token];
    res.json({ message: 'Logged out' });
}

module.exports = { login, logout };
