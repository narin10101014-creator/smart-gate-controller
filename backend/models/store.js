const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const gateState = {
    status: 'closed',
    updatedAt: new Date().toISOString(),
};

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

const sessions = {};
const logs = [];

function parseDurationMs(value) {
    const match = /^(\d+(?:\.\d+)?)(s|m|h)$/.exec(value.trim());
    if (!match) {
        throw new Error(`Invalid SESSION_TTL "${value}" - expected a number followed by s, m, or h (e.g. "20s", "30m", "24h")`);
    }
    const amount = Number(match[1]);
    const msPerUnit = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000 };
    return amount * msPerUnit[match[2]];
}

const SESSION_TTL_MS = parseDurationMs(process.env.SESSION_TTL || '24h');

function createSession(user) {
    const token = uuidv4();
    sessions[token] = {
        id: user.id,
        username: user.username,
        role: user.role,
        expiresAt: Date.now() + SESSION_TTL_MS,
    };
    return token;
}

function getSession(token) {
    const session = sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        delete sessions[token];
        return null;
    }
    return session;
}

function deleteSession(token) {
    delete sessions[token];
}

function addLog(entry) {
    const record = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...entry,
    };
    logs.unshift(record);
    if (logs.length > 100) logs.length = 100;
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
    gateState,
    users,
    logs,
    addLog,
    setPendingCommand,
    takePendingCommand,
    createSession,
    getSession,
    deleteSession,
};
