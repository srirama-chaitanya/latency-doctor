import React from 'react';

const TimelineGraph = ({ data }) => {
    if (!data || !data.steps) return null;

    const { totalMs, steps } = data;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Request Timeline</h3>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    Total: {totalMs.toFixed(2)}ms
                </span>
            </div>

            <div className="timeline-container">
                {steps.map((step, index) => {
                    // Calculate percentage width relative to total request time
                    const widthPercent = Math.max((step.ms / totalMs) * 100, 1); // Min 1% visibility

                    // Simple heuristic: if step takes > 30% of total time, mark it red?
                    // Or if it's explicitly lengthy. Let's stick to gradient for now.
                    const isSlow = widthPercent > 50;

                    return (
                        <div key={index} className="timeline-row">
                            <div className="step-label" title={step.name}>{step.name}</div>
                            <div className="step-bar-container">
                                <div
                                    className={`step-bar ${isSlow ? 'warning' : ''}`}
                                    style={{ width: `${widthPercent}%` }}
                                />
                            </div>
                            <div className="step-time">{step.ms}ms</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelineGraph;
