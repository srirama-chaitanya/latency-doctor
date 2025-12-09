const express = require('express');
const { profilerMiddleware, Timeline } = require('./profiler');

const app = express();
const PORT = 3000;

// Use the profiler middleware globally
app.use(profilerMiddleware());

// Helper to simulate delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/', (req, res) => {
    Timeline.start('handler_logic');
    res.json({ message: 'Hello World' });
    Timeline.end('handler_logic');
});

app.get('/complex', async (req, res) => {
    Timeline.start('validate_input');
    await sleep(10); // Simulate validation
    Timeline.end('validate_input');

    Timeline.start('db_find_user');
    await sleep(120); // Simulate DB query
    Timeline.end('db_find_user');

    Timeline.start('external_api_call');
    await sleep(200); // Simulate external API
    Timeline.end('external_api_call');

    Timeline.record('process_data', 5.5); // Manual record

    res.json({
        data: 'Complex operation result',
        user_id: 123
    });
});

// Calibration Route: To test accuracy
// We sleep for exactly 50ms, 100ms, 150ms.
// The graph should show steps of increasing size (1:2:3 ratio).
app.get('/calibration', async (req, res) => {
    Timeline.start('step_50ms');
    await sleep(50);
    Timeline.end('step_50ms');

    Timeline.start('step_100ms');
    await sleep(100);
    Timeline.end('step_100ms');

    Timeline.start('step_150ms');
    await sleep(150);
    Timeline.end('step_150ms');

    res.json({ verified: true });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
