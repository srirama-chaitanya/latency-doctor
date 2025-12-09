const express = require('express');
const { profilerMiddleware, Timeline } = require('latency-doctor-sriram');

const app = express();
const PORT = 5000;

// 1. Initialize the Profiler using your PRODUCTION URL
app.use(profilerMiddleware({
    reportingUrl: 'https://latency-doctor.onrender.com/api/ingest',
    apiKey: 'my-secret-key' // Optional, for future use
}));

// Mock Database Helper
const mockDbQuery = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Route 1: Simple Login
app.post('/auth/login', async (req, res) => {
    Timeline.start('validate_email');
    await mockDbQuery(50);
    Timeline.end('validate_email');

    Timeline.start('hash_password');
    await mockDbQuery(120); // Simulating slow hashing
    Timeline.end('hash_password');

    Timeline.start('generate_token');
    await mockDbQuery(10);
    Timeline.end('generate_token');

    res.json({ token: 'abc-123', user: 'sriram' });
});

// Route 2: Heavy Product Search
app.get('/products/search', async (req, res) => {
    Timeline.start('parse_query');
    await mockDbQuery(5);
    Timeline.end('parse_query');

    Timeline.start('elasticsearch_lookup');
    await mockDbQuery(400); // 400ms slow query
    Timeline.end('elasticsearch_lookup');

    Timeline.start('enrich_metadata');
    await mockDbQuery(50);
    Timeline.end('enrich_metadata');

    res.json({ results: [{ id: 1, name: 'Cool Widget' }] });
});

app.listen(PORT, () => {
    console.log(`🛒 Real World App running on http://localhost:${PORT}`);
    console.log('Try sending requests to /auth/login or /products/search');
});
