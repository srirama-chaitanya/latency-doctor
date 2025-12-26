# Latency Doctor 🩺

**Latency Doctor** is a high-precision performance profiler ecosystem for Node.js applications. It helps developers visualize exactly where time is being spent in their API requests—differentiating between Database queries, External API calls, and Application Logic—without intricate manual instrumentation.

## 🚀 Features

-   **Granular Profiling**: Break down latency into meaningful segments (DB, External, Logic).
-   **Low Overhead SDK**: Non-intrusive `AsyncLocalStorage`-based middleware for Node.js/Express.
-   **Real-time Dashboard**: Visualize request timelines to identify bottlenecks instantly.
-   **Fire-and-Forget**: Asynchronous trace reporting ensures your API performance isn't impacted.

## 🏗️ Architecture

The project consists of three main components working together:

1.  **SDK (`latency-doctor-sriram`)**: A Node.js middleware that you install in your API. It captures start/end times of operations and sends them to the Dashboard API.
2.  **Dashboard API**: The ingestion server that receives traces from the SDK and stores them (SQLite/PostgreSQL).
3.  **Frontend**: A React-based dashboard to view and analyze the captured traces.

## 🛠️ Getting Started

To run the full observability stack locally, follow these steps:

### Prerequisites
-   Node.js (v18 or higher recommended)
-   npm

### 1. Start the Dashboard API (Ingestion)
This service listens for incoming traces and serves data to the frontend.

```bash
cd dashboard-api
npm install
npm start
```
*Runs on `http://localhost:4000` by default.*

### 2. Start the Frontend Dashboard
This is the UI where you will view the traces.

```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173` by default.*

### 3. Integrate SDK into Your App
Install the SDK in your Node.js application:

```bash
npm install latency-doctor-sriram
```
*See [sdk-package/README.md](./sdk-package/README.md) for detailed integration instructions.*

## 📂 Project Structure

-   `sdk-package/`: Source code for the `latency-doctor-sriram` NPM package.
-   `dashboard-api/`: Backend server for data ingestion and reporting.
-   `frontend/`: React application for visualizing traces.
-   `example-real-world-app/`: A demo application using the SDK for testing.
-   `showcase-app/`: Another simple example usage.

## 🤝 Contributing

Contributions are welcome! Please run tests before submitting a PR.

## 📄 License
MIT
