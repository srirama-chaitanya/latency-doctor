const { profilerMiddleware, Timeline } = require('./index');
const http = require('https');

// CONFIGURATION
const CLOUD_API_URL = 'https://latency-doctor.onrender.com/api/ingest';
const API_KEY = 'secret-123'; 

console.log('🚀 Starting Integration Test...');
console.log('Target: ' + CLOUD_API_URL);

const req = { method: 'GET', path: '/integration-test-endpoint' };
const res = {
    json: (body) => {
        console.log('✅ Response sent to user:', body);
    }
};
const next = () => {
    Timeline.start('test_db_query');
    setTimeout(() => {
        Timeline.end('test_db_query');
        console.log('...Work finished.');
        res.json({ success: true });
    }, 500);
};

const mw = profilerMiddleware({
    reportingUrl: CLOUD_API_URL,
    apiKey: API_KEY
});

mw(req, res, next);
