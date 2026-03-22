const { autoInstrumentHttp, autoInstrumentPg, profilerMiddleware } = require('latency-doctor-sriram');

// 1. Initialize Auto-Instrumentation FIRST (before routes)
autoInstrumentHttp(); // Automatically tracks all outbound HTTP/HTTPS calls

// Mocking a PostgreSQL driver so this showcase runs without needing a real DB installed
const mockPgClient = {
    prototype: {
        query: function(sql, params, cb) {
            return new Promise(resolve => {
                // Simulate a 300ms database query
                setTimeout(() => resolve({ rows: [] }), 300);
            });
        }
    }
};
autoInstrumentPg({ Client: mockPgClient });

const express = require('express');
const https = require('https');

const app = express();
const PORT = 5002; // Running on 5002 so it doesn't conflict with V1 or Dashboard

// 2. Attach the SDK Middleware
app.use(profilerMiddleware({
    reportingUrl: 'http://localhost:4000/api/ingest'
}));

// Helper for Mock Database
const executeQuery = (sql) => mockPgClient.prototype.query(sql);

// 3. The Pure Business Logic Route
app.get('/auto-magic', async (req, res) => {
    console.log('Incoming request to /auto-magic...');

    // A. Make an outbound HTTP Request (Notice: NO Timeline.start needed!)
    await new Promise((resolve) => {
        https.get('https://dummyjson.com/products/1', (resp) => {
            resp.on('data', () => {});
            resp.on('end', resolve);
        });
    });

    // B. Run a Database Query (Notice: NO Timeline.start needed!)
    await executeQuery('SELECT * FROM users WHERE active = true');

    res.json({
        message: 'This route was 100% auto-instrumented!',
        proof: 'Check your Latency Doctor dashboard. You should see spans for HTTP_OUT and DB instantly without a single Timeline.start() in this route!'
    });
});

app.get('/auto-multiple', async (req, res) => {
    console.log('Incoming request to /auto-multiple...');

    // 1. Fetch from First External API
    await new Promise((resolve) => {
        https.get('https://dummyjson.com/products/1', (resp) => {
            resp.on('data', () => {});
            resp.on('end', resolve);
        });
    });

    // 2. Fetch from Second External API (happens after the first completes)
    await new Promise((resolve) => {
        https.get('https://pokeapi.co/api/v2/pokemon/ditto', (resp) => {
            resp.on('data', () => {});
            resp.on('end', resolve);
        });
    });

    // 3. Execute a DB query
    await executeQuery('SELECT * FROM user_preferences WHERE user_id = 99');

    res.json({
        message: 'Multiple consecutive API calls safely 100% auto-traced!',
        proof: 'Check your dashboard! You should see 2 HTTP_OUT bars perfectly staggered, followed by 1 DB bar.'
    });
});

app.listen(PORT, () => {
    console.log(`✨ V2 Auto-Instrumentation Showcase running on http://localhost:${PORT}`);
    console.log(`👉 Send a GET request to http://localhost:${PORT}/auto-magic`);
});
