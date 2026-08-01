const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { parseDurationMs } = require('../utils/duration');
const { formatDateTime, parseDateTime } = require('../utils/datetime');
const db = require('./db');

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name} (see backend/.env.example)`);
    }
    return value;
}

const users = [
    { id: 'user1', username: 'admin', passwordHash: bcrypt.hashSync(requireEnv('ADMIN_PASSWORD'), 10), role: 'owner' },
    { id: 'user2', username: 'family', passwordHash: bcrypt.hashSync(requireEnv('FAMILY_PASSWORD'), 10), role: 'guest' },
];

const SESSION_TTL_MS = parseDurationMs(process.env.SESSION_TTL || '24h', 'SESSION_TTL');

const insertSession = db.prepare(
    'INSERT INTO sessions (token, user_id, username, role, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);
const selectSession = db.prepare('SELECT * FROM sessions WHERE token = ?');
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE token = ?');

function createSession(user) {
    const token = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    insertSession.run(token, user.id, user.username, user.role, formatDateTime(expiresAt), formatDateTime(now));
    return token;
}

function getSession(token) {
    const row = selectSession.get(token);
    if (!row) return null;
    // 'YYYY-MM-DD HH:MM:SS' sorts lexicographically the same as chronologically,
    // as long as every value uses this same zero-padded format.
    if (formatDateTime() > row.expires_at) {
        deleteSessionStmt.run(token);
        return null;
    }
    return { id: row.user_id, username: row.username, role: row.role };
}

function deleteSession(token) {
    deleteSessionStmt.run(token);
}

const insertLog = db.prepare('INSERT INTO logs (id, timestamp, type, user, message) VALUES (?, ?, ?, ?, ?)');
const selectLogs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100');

function addLog(entry) {
    insertLog.run(uuidv4(), formatDateTime(), entry.type, entry.user, entry.message);
}

function getLogs() {
    return selectLogs.all().map((row) => ({
        id: row.id,
        // Converted back to ISO here so the REST API response shape/format is
        // unchanged - only the stored representation is now human-readable.
        timestamp: parseDateTime(row.timestamp).toISOString(),
        type: row.type,
        user: row.user,
        message: row.message,
    }));
}

const selectGateState = db.prepare('SELECT status, updated_at FROM gate_state WHERE id = 1');
const updateGateState = db.prepare('UPDATE gate_state SET status = ?, updated_at = ? WHERE id = 1');

function getGateState() {
    const row = selectGateState.get();
    return { status: row.status, updatedAt: parseDateTime(row.updated_at).toISOString() };
}

function setGateState(status) {
    updateGateState.run(status, formatDateTime());
}

let pendingCommand = null; // { action: 'open' | 'close', requestedAt } | null

function setPendingCommand(action) {
    pendingCommand = { action, requestedAt: new Date().toISOString() };
}

function takePendingCommand() {
    const command = pendingCommand;
    pendingCommand = null;
    return command;
}

module.exports = {
    users,
    getGateState,
    setGateState,
    addLog,
    getLogs,
    setPendingCommand,
    takePendingCommand,
    createSession,
    getSession,
    deleteSession,
};
