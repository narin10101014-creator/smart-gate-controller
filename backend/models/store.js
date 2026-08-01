const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { parseDurationMs } = require('../utils/duration');
const { parseDateTime } = require('../utils/datetime');
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
const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);

// 'now'/'localtime' and the expiry comparison are all computed by SQLite
// itself rather than formatted in JS, so there's a single source of truth
// for "what time is it" and no risk of the JS/SQL formats drifting apart.
const insertSession = db.prepare(`
    INSERT INTO sessions (token, user_id, username, role, expires_at, created_at)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime', '+' || ? || ' seconds'), datetime('now', 'localtime'))
`);
const selectSessionWithValidity = db.prepare(
    "SELECT *, (expires_at > datetime('now', 'localtime')) AS valid FROM sessions WHERE token = ?"
);
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE token = ?');

function createSession(user) {
    const token = uuidv4();
    insertSession.run(token, user.id, user.username, user.role, SESSION_TTL_SECONDS);
    return token;
}

function getSession(token) {
    const row = selectSessionWithValidity.get(token);
    if (!row) return null;
    if (!row.valid) {
        deleteSessionStmt.run(token);
        return null;
    }
    return { id: row.user_id, username: row.username, role: row.role };
}

function deleteSession(token) {
    deleteSessionStmt.run(token);
}

const insertLog = db.prepare(
    "INSERT INTO logs (id, timestamp, type, user, message) VALUES (?, datetime('now', 'localtime'), ?, ?, ?)"
);
const selectLogs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100');

function addLog(entry) {
    insertLog.run(uuidv4(), entry.type, entry.user, entry.message);
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
const updateGateState = db.prepare(
    "UPDATE gate_state SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = 1"
);

function getGateState() {
    const row = selectGateState.get();
    return { status: row.status, updatedAt: parseDateTime(row.updated_at).toISOString() };
}

function setGateState(status) {
    updateGateState.run(status);
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
