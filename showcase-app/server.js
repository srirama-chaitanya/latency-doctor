const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { profilerMiddleware, Timeline } = require('latency-doctor-sriram');

const app = express();
const PORT = 5001; // Different port than localhost:5000

// 1. Setup Profiler (Points to your Cloud Dashboard)
app.use(profilerMiddleware({
    reportingUrl: 'https://latency-doctor.onrender.com/api/ingest',
    apiKey: 'demo-user-key'
}));

const db = new sqlite3.Database('store.db');

// Helper for Promisified DB Queries (to make await cleaner)
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

// ROUTE 1: THE SLOW WAY (N+1 Problem) 🐌
app.get('/orders-slow', async (req, res) => {
    Timeline.start('fetch_orders');
    // 1. Get 50 orders
    const orders = await dbRun('SELECT * FROM orders LIMIT 50');
    Timeline.end('fetch_orders');

    const result = [];

    Timeline.start('enrich_loop');
    // 2. Loop through them (THE MISTAKE)
    for (const order of orders) {
        // 3. Query DB inside the loop
        Timeline.start('fetch_user_details');
        const users = await dbRun('SELECT * FROM users WHERE id = ?', [order.user_id]);
        Timeline.end('fetch_user_details');

        result.push({ ...order, user: users[0] });
    }
    Timeline.end('enrich_loop');

    res.json(result);
});

// ROUTE 2: THE FAST WAY (SQL Join) 🐇
app.get('/orders-fast', async (req, res) => {
    Timeline.start('fetch_orders_joined');
    // 1. Get everything in ONE query
    const sql = `
        SELECT orders.*, users.name as user_name, users.email 
        FROM orders 
        JOIN users ON orders.user_id = users.id 
        LIMIT 50
    `;
    const orders = await dbRun(sql);
    Timeline.end('fetch_orders_joined');

    res.json(orders);
});

app.listen(PORT, () => {
    console.log(`🐢 Slow App running on http://localhost:${PORT}`);
    console.log(`Try /orders-slow vs /orders-fast`);
});
