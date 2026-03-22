const http = require('http');
const https = require('https');

const patchHttpModule = (moduleToPatch, protocol, Timeline) => {
    const originalRequest = moduleToPatch.request;
    const originalGet = moduleToPatch.get;

    const createPatch = (originalFn) => function (...args) {
        const timeline = Timeline.current;
        if (!timeline) return originalFn.apply(this, args);

        const start = process.hrtime.bigint();
        
        try {
            let targetUrl = 'unknown';
            if (typeof args[0] === 'string') targetUrl = args[0];
            else if (typeof args[0] === 'object' && args[0] !== null) {
                targetUrl = `${args[0].protocol || protocol}//${args[0].hostname || args[0].host}${args[0].path || ''}`;
            }

            const clientRequest = originalFn.apply(this, args);

            clientRequest.on('response', (res) => {
                res.prependListener('end', () => {
                   const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
                   timeline.steps.push({
                        name: `HTTP_OUT: ${targetUrl}`,
                        ms: parseFloat(durationMs.toFixed(3))
                   });
                });
            });

            clientRequest.on('error', () => { /* silently swallow APM errors */ });

            return clientRequest;
        } catch (error) {
            return originalFn.apply(this, args);
        }
    };

    moduleToPatch.request = createPatch(originalRequest);
    if (originalGet) moduleToPatch.get = createPatch(originalGet);
};

const initializeHttpAutoPatch = (Timeline) => {
    patchHttpModule(http, 'http:', Timeline);
    patchHttpModule(https, 'https:', Timeline);
};

module.exports = { initializeHttpAutoPatch };
