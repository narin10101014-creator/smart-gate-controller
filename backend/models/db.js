const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

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
// new TEXT-column version, copy every row across in a single INSERT...SELECT
// that converts the timestamp via SQLite's own datetime()/unixepoch modifiers
// (no per-row JS date formatting), then drop the renamed original. No-op if
// the table doesn't exist yet or is already on the TEXT schema.
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
            db.exec(`
                INSERT INTO sessions (token, user_id, username, role, expires_at, created_at)
                SELECT token, user_id, username, role,
                       datetime(expires_at / 1000, 'unixepoch', 'localtime'),
                       datetime(created_at / 1000, 'unixepoch', 'localtime')
                FROM sessions_old_int
            `);
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
            db.exec(`
                INSERT INTO logs (id, timestamp, type, user, message)
                SELECT id, datetime(timestamp / 1000, 'unixepoch', 'localtime'), type, user, message
                FROM logs_old_int
            `);
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
            db.exec(`
                INSERT INTO gate_state (id, status, updated_at)
                SELECT id, status, datetime(updated_at / 1000, 'unixepoch', 'localtime')
                FROM gate_state_old_int
            `);
            db.exec('DROP TABLE gate_state_old_int');
        }
    });
    migration();
}

// One-time migration enforcing at most one session row per user_id, needed to
// add the UNIQUE(user_id) constraint that the single-session-per-user policy
// relies on (see store.js's `INSERT OR REPLACE`). Keeps only the most recently
// created session per user - older ones are exactly the sessions the policy
// says should already be gone. No-op if the table doesn't exist yet or the
// constraint is already in place.
function migrateSessionsUniquePerUser() {
    const migration = db.transaction(() => {
        const existing = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='sessions'").get();
        if (existing && !/user_id TEXT NOT NULL UNIQUE/.test(existing.sql)) {
            db.exec('ALTER TABLE sessions RENAME TO sessions_old_multi');
            db.exec(`
                CREATE TABLE sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL UNIQUE,
                    username TEXT NOT NULL,
                    role TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            `);
            db.exec(`
                INSERT INTO sessions (token, user_id, username, role, expires_at, created_at)
                SELECT token, user_id, username, role, expires_at, created_at
                FROM sessions_old_multi s1
                WHERE rowid = (SELECT MAX(rowid) FROM sessions_old_multi s2 WHERE s2.user_id = s1.user_id)
            `);
            db.exec('DROP TABLE sessions_old_multi');
        }
    });
    migration();
}

migrateIntegerTimestamps();
migrateSessionsUniquePerUser();

db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
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

db.prepare("INSERT OR IGNORE INTO gate_state (id, status, updated_at) VALUES (1, 'closed', datetime('now', 'localtime'))").run();

module.exports = db;
