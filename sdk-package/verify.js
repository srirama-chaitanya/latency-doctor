const { Timeline, profilerMiddleware } = require('./index');

console.log('Testing SDK Exports...');

if (typeof Timeline !== 'function') {
    throw new Error('Timeline class is missing!');
}
if (typeof profilerMiddleware !== 'function') {
    throw new Error('profilerMiddleware function is missing!');
}

console.log('✅ Exports verified: Timeline and middleware are present.');
