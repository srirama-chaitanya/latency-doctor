# Latency Doctor SDK 🩺

A high-precision middleware for profiling Node.js/Express API latency.
It breaks down your request latency into granular steps (Database, External API, Logic) and visualizes them.

## Installation

```bash
npm install latency-doctor-sriram
```

## 🚀 V2: Zero-Config Auto-Instrumentation (Recommended)

You no longer need to manually write `Timeline.start()` and `Timeline.end()`. The SDK can automatically profile all outgoing HTTP requests and PostgreSQL queries.

```javascript
const { autoInstrumentHttp, autoInstrumentPg, profilerMiddleware } = require('latency-doctor-sriram');

// 1. Initialize Auto-Patchers BEFORE requiring routers or connecting to DBs
autoInstrumentHttp();
autoInstrumentPg(require('pg')); 

const express = require('express');
const app = express();

// 2. Setup Middleware
app.use(profilerMiddleware({
    reportingUrl: 'http://localhost:4000/api/ingest',
}));
```

## Manual Usage (V1)

### 1. Setup Middleware
Add this to the top of your `server.js` (before defining routes):

```javascript
const express = require('express');
const { profilerMiddleware, Timeline } = require('latency-doctor-sriram');

const app = express();

app.use(profilerMiddleware({
    // URL of your Latency Doctor Ingestion API
    reportingUrl: 'https://latency-doctor.onrender.com/api/ingest',
    // (Optional) API Key if you have configured one
    apiKey: 'your-api-key'
}));
```

### 2. Instrument Code
Wrap your slow operations with `Timeline.start()` and `Timeline.end()`.

```javascript
app.get('/products', async (req, res) => {
    // Measure Database Query
    Timeline.start('fetch_products_db');
    const products = await db.query('SELECT * FROM products');
    Timeline.end('fetch_products_db');

    // Measure Data Processing
    Timeline.start('format_response');
    const response = formatData(products);
    Timeline.end('format_response');

    res.json(response);
});
```

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `reportingUrl` | `string` | `http://localhost:4000...` | The endpoint where traces are sent. |
| `apiKey` | `string` | `null` | Optional key for authentication. *(Note: Currently optional for Public Beta)* |

## How it works
1.  Uses `process.hrtime.bigint()` for nanosecond precision.
2.  Uses `AsyncLocalStorage` to track requests across async boundaries without passing context manually.
3.  Sends data asynchronously (fire-and-forget) to avoid slowing down your API.

## 📊 View Your Data
Once your app is running and sending data, view your traces here:
👉 **[Open Latency Doctor Dashboard](https://latency-doctor.vercel.app/)**

## License
MIT
