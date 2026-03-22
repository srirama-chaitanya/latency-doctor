const sqlite3 = require('sqlite3').verbose();

let dbClient = null;

// Initialize DB Connection
const init = () => {
    // LOCAL: Use SQLite
    dbClient = new sqlite3.Database('timeline.db');
    console.log('[DB] Using SQLite (Local-First Architecture)');

    dbClient.serialize(() => {
        dbClient.run(`CREATE TABLE IF NOT EXISTS requests(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            route TEXT,
            method TEXT,
            totalMs REAL,
            steps TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
};

// Unified Insert Method
const insertRequest = (route, method, totalMs, steps, callback) => {
    const jsonSteps = JSON.stringify(steps);

    const stmt = dbClient.prepare("INSERT INTO requests (route, method, totalMs, steps) VALUES (?, ?, ?, ?)");
    stmt.run(route, method, totalMs, jsonSteps, function (err) {
        callback(err, this ? this.lastID : null);
    });
    stmt.finalize();
};

// Unified Select Method
const getRequests = (limit = 50, callback) => {
    dbClient.all("SELECT * FROM requests ORDER BY id DESC LIMIT ?", [limit], (err, rows) => {
        if (err) return callback(err);
        const results = rows.map(row => ({
            ...row,
            steps: JSON.parse(row.steps)
        }));
        callback(null, results);
    });
};

module.exports = { init, insertRequest, getRequests };
