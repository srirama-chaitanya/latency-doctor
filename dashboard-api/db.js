const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

let dbClient = null;
let mode = 'sqlite';

// Initialize DB Connection
const init = () => {
    if (process.env.DATABASE_URL) {
        // PRODUCTION: Use PostgreSQL
        mode = 'postgres';
        dbClient = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Required for most cloud DBs
        });
        console.log('[DB] Using PostgreSQL');

        // Create Table (Postgres syntax)
        dbClient.query(`
            CREATE TABLE IF NOT EXISTS requests (
                id SERIAL PRIMARY KEY,
                route TEXT,
                method TEXT,
                "totalMs" REAL,
                steps TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `).catch(err => console.error('PG Init Error:', err));

    } else {
        // LOCAL: Use SQLite
        mode = 'sqlite';
        dbClient = new sqlite3.Database('timeline.db');
        console.log('[DB] Using SQLite (Local)');

        dbClient.serialize(() => {
            dbClient.run(`CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route TEXT,
                method TEXT,
                totalMs REAL,
                steps TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });
    }
};

// Unified Insert Method
const insertRequest = (route, method, totalMs, steps, callback) => {
    const jsonSteps = JSON.stringify(steps);

    if (mode === 'postgres') {
        const query = 'INSERT INTO requests (route, method, "totalMs", steps) VALUES ($1, $2, $3, $4) RETURNING id';
        dbClient.query(query, [route, method, totalMs, jsonSteps], (err, res) => {
            if (err) return callback(err);
            callback(null, res.rows[0].id);
        });
    } else {
        const stmt = dbClient.prepare("INSERT INTO requests (route, method, totalMs, steps) VALUES (?, ?, ?, ?)");
        stmt.run(route, method, totalMs, jsonSteps, function (err) {
            callback(err, this ? this.lastID : null);
        });
        stmt.finalize();
    }
};

// Unified Select Method
const getRequests = (limit = 50, callback) => {
    if (mode === 'postgres') {
        dbClient.query('SELECT * FROM requests ORDER BY id DESC LIMIT $1', [limit], (err, res) => {
            if (err) return callback(err);
            // Postgres returns column names exactly as creates. steps is string.
            const results = res.rows.map(row => ({
                ...row,
                steps: typeof row.steps === 'string' ? JSON.parse(row.steps) : row.steps
            }));
            callback(null, results);
        });
    } else {
        dbClient.all("SELECT * FROM requests ORDER BY id DESC LIMIT ?", [limit], (err, rows) => {
            if (err) return callback(err);
            const results = rows.map(row => ({
                ...row,
                steps: JSON.parse(row.steps)
            }));
            callback(null, results);
        });
    }
};

module.exports = { init, insertRequest, getRequests };
