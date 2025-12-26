const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('store.db');

db.serialize(() => {
    // 1. Create Tables
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS products");
    db.run("DROP TABLE IF EXISTS orders");

    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)`);
    db.run(`CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)`);
    db.run(`CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER, date TEXT)`);

    console.log("🌱 Seeding Database (this might take a few seconds)...");

    // 2. Insert Users (100 users)
    const userStmt = db.prepare("INSERT INTO users VALUES (?, ?, ?)");
    for (let i = 0; i < 100; i++) {
        userStmt.run(i, `User ${i}`, `user${i}@example.com`);
    }
    userStmt.finalize();

    // 3. Insert Products (50 products)
    const prodStmt = db.prepare("INSERT INTO products VALUES (?, ?, ?)");
    for (let i = 0; i < 50; i++) {
        prodStmt.run(i, `Product ${i}`, (Math.random() * 100).toFixed(2));
    }
    prodStmt.finalize();

    // 4. Insert Orders (10,000 orders!)
    // This connects random users to random products
    const orderStmt = db.prepare("INSERT INTO orders VALUES (?, ?, ?, ?)");
    db.run("BEGIN TRANSACTION"); // Key for speed
    for (let i = 0; i < 10000; i++) {
        const userId = Math.floor(Math.random() * 100);
        const prodId = Math.floor(Math.random() * 50);
        orderStmt.run(i, userId, prodId, new Date().toISOString());
    }
    db.run("COMMIT", () => {
        console.log("✅ Database Seeded with 10,000 Orders.");
        db.close();
    });
    orderStmt.finalize();
});
