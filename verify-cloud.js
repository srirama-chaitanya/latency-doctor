const { profilerMiddleware, Timeline } = require('./sdk-package/index');
const http = require('https'); // HTTPS for cloud

// CONFIGURATION
const CLOUD_API_URL = 'https://latency-doctor.onrender.com/api/ingest';
const API_KEY = 'secret-123'; // Logic not enforced yet, but good practice

console.log('🚀 Starting Cloud Verification...');
console.log(`Target: ${CLOUD_API_URL}`);

// Mock request/response for middleware
const req = { method: 'GET', path: '/cloud-test-endpoint' };
const res = {
    json: (body) => {
        console.log('✅ Response sent to user:', body);
    }
};
const next = () => {
    // Simulate some work
    Timeline.start('cloud_db_query');
    setTimeout(() => {
        Timeline.end('cloud_db_query');
        console.log('...Work finished.');
        // Trigger the middleware's logic to send data
        res.json({ success: true });
    }, 500);
};

// Initialize Middleware Configured for Cloud
const mw = profilerMiddleware({
    reportingUrl: CLOUD_API_URL,
    apiKey: API_KEY
});

// Run it
mw(req, res, next);
