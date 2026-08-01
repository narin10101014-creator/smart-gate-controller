const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { formatDateTime } = require('../utils/datetime');

const DB_PATH = process.env.DB_PATH || './data/gate.db';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

function columnType(table, column) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    const col = info.find((c) => c.name === column);
    return col ? col.type : null;
}

// One-time migration from the original schema (INTEGER epoch-ms timestamp
// columns) to human-readable TEXT 'YYYY-MM-DD HH:MM:SS' columns. SQLite has
// no ALTER COLUMN, so each table is rebuilt: rename the old table, create the
// new TEXT-column version, copy every row across converting the timestamp
// values, then drop the renamed original. No-op if the table doesn't exist
// yet or is already on the TEXT schema.
function migrateIntegerTimestamps() {
    const migration = db.transaction(() => {
        if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'").get()
            && columnType('sessions', 'expires_at') === 'INTEGER') {
            db.exec('ALTER TABLE sessions RENAME TO sessions_old_int');
            db.exec(`
                CREATE TABLE sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    username TEXT NOT NULL,
                    role TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            `);
            const insert = db.prepare(
                'INSERT INTO sessions (token, user_id, username, role, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            );
            for (const row of db.prepare('SELECT * FROM sessions_old_int').all()) {
                insert.run(
                    row.token, row.user_id, row.username, row.role,
                    formatDateTime(new Date(row.expires_at)), formatDateTime(new Date(row.created_at))
                );
            }
            db.exec('DROP TABLE sessions_old_int');
        }

        if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='logs'").get()
            && columnType('logs', 'timestamp') === 'INTEGER') {
            db.exec('ALTER TABLE logs RENAME TO logs_old_int');
            db.exec(`
                CREATE TABLE logs (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    type TEXT NOT NULL CHECK (type IN ('login','logout','control','device')),
                    user TEXT NOT NULL,
                    message TEXT NOT NULL
                )
            `);
            const insert = db.prepare(
                'INSERT INTO logs (id, timestamp, type, user, message) VALUES (?, ?, ?, ?, ?)'
            );
            for (const row of db.prepare('SELECT * FROM logs_old_int').all()) {
                insert.run(row.id, formatDateTime(new Date(row.timestamp)), row.type, row.user, row.message);
            }
            db.exec('DROP TABLE logs_old_int');
        }

        if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='gate_state'").get()
            && columnType('gate_state', 'updated_at') === 'INTEGER') {
            db.exec('ALTER TABLE gate_state RENAME TO gate_state_old_int');
            db.exec(`
                CREATE TABLE gate_state (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    status TEXT NOT NULL CHECK (status IN ('open','closed')),
                    updated_at TEXT NOT NULL
                )
            `);
            const insert = db.prepare('INSERT INTO gate_state (id, status, updated_at) VALUES (?, ?, ?)');
            for (const row of db.prepare('SELECT * FROM gate_state_old_int').all()) {
                insert.run(row.id, row.status, formatDateTime(new Date(row.updated_at)));
            }
            db.exec('DROP TABLE gate_state_old_int');
        }
    });
    migration();
}

migrateIntegerTimestamps();

db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('login','logout','control','device')),
        user TEXT NOT NULL,
        message TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);

    CREATE TABLE IF NOT EXISTS gate_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        status TEXT NOT NULL CHECK (status IN ('open','closed')),
        updated_at TEXT NOT NULL
    );
`);

db.prepare('INSERT OR IGNORE INTO gate_state (id, status, updated_at) VALUES (1, ?, ?)').run('closed', formatDateTime());

module.exports = db;
