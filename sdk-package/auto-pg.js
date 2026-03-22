const patchPgDriver = (pgModule, Timeline) => {
    if (!pgModule || !pgModule.Client || !pgModule.Client.prototype.query) return;

    const originalQuery = pgModule.Client.prototype.query;

    pgModule.Client.prototype.query = function (...args) {
        if (!Timeline.current) return originalQuery.apply(this, args);

        const start = process.hrtime.bigint();
        
        let sqlQuery = 'UNKNOWN_QUERY';
        if (typeof args[0] === 'string') sqlQuery = args[0];
        else if (typeof args[0] === 'object' && args[0].text) sqlQuery = args[0].text;

        const statement = sqlQuery.substring(0, 100).replace(/\n/g, ' ').trim();

        const recordSpan = () => {
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
            Timeline.record(`DB: ${statement}`, parseFloat(durationMs.toFixed(3)));
        };

        try {
            const lastArgIndex = args.length - 1;
            const maybeCallback = args[lastArgIndex];

            if (typeof maybeCallback === 'function') {
                args[lastArgIndex] = function (...cbArgs) {
                    recordSpan();
                    return maybeCallback.apply(this, cbArgs);
                };
                return originalQuery.apply(this, args);
            }

            const queryPromise = originalQuery.apply(this, args);
            
            if (queryPromise && typeof queryPromise.then === 'function') {
                return queryPromise
                    .then((result) => { recordSpan(); return result; })
                    .catch((err) => { recordSpan(); throw err; });
            }
        } catch (e) { /* swallow */ }

        return originalQuery.apply(this, args);
    };
};

module.exports = { patchPgDriver };
