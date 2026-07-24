const { v4: uuidv4 } = require('uuid');

const gateState = {
    status: 'closed',
    updatedAt: new Date().toISOString(),
};

const users = [
    { id: 'user1', username: 'admin', password: 'admin123', role: 'owner' },
    { id: 'user2', username: 'family', password: 'family123', role: 'guest' },
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
