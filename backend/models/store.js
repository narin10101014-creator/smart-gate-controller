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

function addLog(entry) {
    const record = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...entry,
    };
    logs.unshift(record);
    if (logs.length > 100) logs.length = 100;
}

module.exports = {
    gateState,
    users,
    sessions,
    logs,
    addLog,
};
