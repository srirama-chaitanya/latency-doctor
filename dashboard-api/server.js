const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize DB (Auto-detects PG vs SQLite)
db.init();

// DOGFOODING: Profile our own API! 🐶
const { profilerMiddleware, Timeline } = require('latency-doctor-sriram');

// Recursion Guard: Don't profile the profiler's own ingestion calls
const profiler = profilerMiddleware({
    // In Production: defaults to itself (latency-doctor.onrender.com)
    // In Local: defaults to localhost:4000
    // We can rely on defaults or Env Vars here. 
    reportingUrl: 'https://latency-doctor.onrender.com/api/ingest', // Point to Cloud
    apiKey: 'dogfood-key'
});

const safeProfiler = (req, res, next) => {
    if (req.path === '/api/ingest') {
        return next(); // Skip ingestion to prevent infinite loop
    }
    profiler(req, res, next);
};

app.use(safeProfiler);

// Routes

// 1. Ingest Endpoint (Called by SDK)
app.post('/api/ingest', (req, res) => {
    const { route, method, totalMs, steps } = req.body;

    // Basic validation
    if (!steps || !totalMs) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    db.insertRequest(route, method, totalMs, steps, (err, id) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log(`[Ingest] Saved trace for ${method} ${route} (${totalMs}ms)`);
        res.status(201).json({ id });
    });
});

// 2. Retrieval Endpoint (Called by Frontend)
app.get('/api/requests', (req, res) => {
    Timeline.start('fetch_dashboard_data');
    db.getRequests(50, (err, results) => {
        Timeline.end('fetch_dashboard_data');
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Dashboard API running on http://localhost:${PORT}`);
});
