import React, { useState, useEffect } from 'react';
import TimelineGraph from './components/TimelineGraph';

function App() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      // Use Env Var or fallback to localhost
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${baseUrl}/api/requests`);
      const json = await res.json();
      if (json && json.length > 0) {
        // Just show the latest one for now
        setData(json[0]);
      }
    } catch (err) {
      console.error("Failed to fetch timeline data", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 2 seconds
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Latency <span style={{ color: 'var(--accent-blue)' }}>Doctor</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Visualizing API performance, one millisecond at a time.
        </p>
      </header>

      <main>
        {data ? (
          <>
            <div style={{ marginBottom: '1rem', textAlign: 'center', opacity: 0.7 }}>
              Latest Request: <code>{data.method} {data.route}</code>
            </div>
            <TimelineGraph data={data} />
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Waiting for incoming requests...
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
