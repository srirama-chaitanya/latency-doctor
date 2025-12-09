const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

class Timeline {
    constructor() {
        this.steps = [];
        this.startTime = process.hrtime.bigint();
        this.activeSteps = new Map();
    }

    static get current() {
        return storage.getStore();
    }

    static start(label) {
        const timeline = Timeline.current;
        if (!timeline) return;

        // Use high-resolution time
        const start = process.hrtime.bigint();
        timeline.activeSteps.set(label, start);
    }

    static end(label) {
        const timeline = Timeline.current;
        if (!timeline) return;

        const start = timeline.activeSteps.get(label);
        if (!start) {
            console.warn(`Timeline warning: No start time found for step '${label}'`);
            return;
        }

        const end = process.hrtime.bigint();
        const durationNs = end - start;
        // Convert nanoseconds to milliseconds (float)
        const durationMs = Number(durationNs) / 1e6;

        timeline.steps.push({
            name: label,
            ms: parseFloat(durationMs.toFixed(3))
        });

        timeline.activeSteps.delete(label);
    }

    static record(label, durationMs) {
        const timeline = Timeline.current;
        if (!timeline) return;

        timeline.steps.push({
            name: label,
            ms: durationMs
        });
    }

    serialize() {
        const endTime = process.hrtime.bigint();
        const totalNs = endTime - this.startTime;
        const totalMs = Number(totalNs) / 1e6;

        return {
            totalMs: parseFloat(totalMs.toFixed(3)),
            steps: this.steps
        };
    }
}

const http = require('http');

const profilerMiddleware = (options = {}) => {
    // Configuration defaults
    const config = {
        reportingUrl: options.reportingUrl || 'http://localhost:4000/api/ingest',
        apiKey: options.apiKey || null
    };

    return (req, res, next) => {
        const timeline = new Timeline();

        storage.run(timeline, () => {
            // Hook into response to inject timeline AND send to dashboard
            const originalJson = res.json;

            res.json = function (body) {
                const timelineData = timeline.serialize();

                // 1. Inject into response (optional, but good for debugging)
                if (typeof body === 'object' && body !== null) {
                    body._timeline = timelineData;
                }

                // 2. Fire-and-forget send to Dashboard API
                const payload = JSON.stringify({
                    route: req.path,
                    method: req.method,
                    ...timelineData
                });

                // Parse the target URL
                let targetHostname, targetPort, targetPath, targetProtocol;
                try {
                    const url = new URL(config.reportingUrl);
                    targetHostname = url.hostname;
                    targetPort = url.port || (url.protocol === 'https:' ? 443 : 80);
                    targetPath = url.pathname;
                    targetProtocol = url.protocol === 'https:' ? require('https') : require('http');
                } catch (e) {
                    console.warn('[Profiler] Invalid reporting URL, defaulting to local');
                    targetHostname = 'localhost';
                    targetPort = 4000;
                    targetPath = '/api/ingest';
                    targetProtocol = require('http');
                }

                const requestOptions = {
                    hostname: targetHostname,
                    port: targetPort,
                    path: targetPath,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload)
                    }
                };

                // Add API Key if present
                if (config.apiKey) {
                    requestOptions.headers['x-api-key'] = config.apiKey;
                }

                const reqToDashboard = targetProtocol.request(requestOptions, (resFromDashboard) => {
                    // We don't really care about the response, just that it was sent.
                });

                reqToDashboard.on('error', (e) => {
                    // Silently fail if dashboard is down, don't crash the user's app
                    // console.error(`[Profiler] Failed to send trace: ${e.message}`);
                });

                reqToDashboard.write(payload);
                reqToDashboard.end();

                return originalJson.call(this, body);
            };

            next();
        });
    };
};

module.exports = {
    Timeline,
    profilerMiddleware
};
