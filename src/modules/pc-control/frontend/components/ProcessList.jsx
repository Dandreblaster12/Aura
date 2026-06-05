/**
 * AURA AI - Process List Component
 * J.A.R.V.I.S.-style holographic process viewer
 * Shows top processes with CPU/memory usage
 */

import React, { useState, useEffect, useCallback } from 'react';

const ProcessList = ({ apiBase = 'http://localhost:3001/api/pc-control' }) => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('cpu');

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/hardware/processes?limit=20`);
      const data = await res.json();
      if (data.success) {
        setProcesses(data.data);
      }
    } catch (err) {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [fetchProcesses]);

  const sortedProcesses = [...processes].sort((a, b) => {
    const aVal = parseFloat(a[sortBy === 'cpu' ? 'cpuPercent' : 'memoryMB'] || a[sortBy === 'cpu' ? 'cpuPercent' : 'memoryPercent'] || 0);
    const bVal = parseFloat(b[sortBy === 'cpu' ? 'cpuPercent' : 'memoryMB'] || b[sortBy === 'cpu' ? 'cpuPercent' : 'memoryPercent'] || 0);
    return bVal - aVal;
  });

  return (
    <div className="aura-process-panel">
      <div className="aura-card aura-glow">
        <div className="aura-card-header">
          <span className="aura-icon">⚙️</span>
          <span>RUNNING PROCESSES</span>
          <span className="aura-badge">{processes.length}</span>
        </div>

        {/* Sort controls */}
        <div className="aura-sort-bar">
          <span className="aura-sort-label">Sort by:</span>
          <button
            className={`aura-sort-btn ${sortBy === 'cpu' ? 'active' : ''}`}
            onClick={() => setSortBy('cpu')}
          >
            CPU
          </button>
          <button
            className={`aura-sort-btn ${sortBy === 'memory' ? 'active' : ''}`}
            onClick={() => setSortBy('memory')}
          >
            Memory
          </button>
        </div>

        {/* Process list */}
        <div className="aura-process-list">
          {loading ? (
            <div className="aura-loading-row">Scanning processes...</div>
          ) : sortedProcesses.length === 0 ? (
            <div className="aura-loading-row">No process data available</div>
          ) : (
            sortedProcesses.map((proc, i) => (
              <div key={i} className="aura-process-row">
                <span className="aura-process-rank">#{i + 1}</span>
                <div className="aura-process-info">
                  <span className="aura-process-name">{proc.name || proc.Name}</span>
                  <span className="aura-process-pid">
                    {proc.pid ? `PID: ${proc.pid}` : ''}
                  </span>
                </div>
                <div className="aura-process-metrics">
                  <div className="aura-process-metric">
                    <div className="aura-metric-bar-container">
                      <div
                        className="aura-metric-bar aura-cpu-bar"
                        style={{ width: `${Math.min(parseFloat(proc.cpuPercent || 0) * 2, 100)}%` }}
                      />
                    </div>
                    <span className="aura-metric-value">
                      {proc.cpuPercent ? `${proc.cpuPercent}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="aura-process-metric">
                    <div className="aura-metric-bar-container">
                      <div
                        className="aura-metric-bar aura-mem-bar"
                        style={{ width: `${Math.min(parseFloat(proc.memoryMB || proc.memoryPercent || 0) * 2, 100)}%` }}
                      />
                    </div>
                    <span className="aura-metric-value">
                      {proc.memoryMB ? `${proc.memoryMB} MB` : proc.memoryPercent ? `${proc.memoryPercent}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .aura-process-panel { max-width: 800px; margin: 0 auto; }
        .aura-badge {
          background: rgba(0, 212, 255, 0.2); padding: 2px 8px; border-radius: 10px;
          font-size: 11px; margin-left: 8px;
        }
        .aura-sort-bar {
          display: flex; align-items: center; gap: 10px; margin-bottom: 15px;
          font-size: 11px; color: rgba(192, 212, 232, 0.6);
        }
        .aura-sort-btn {
          background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.2);
          color: rgba(192, 212, 232, 0.8); padding: 4px 12px; border-radius: 4px;
          font-size: 11px; cursor: pointer; transition: all 0.2s;
        }
        .aura-sort-btn.active { background: rgba(0, 212, 255, 0.2); color: #00d4ff; border-color: #00d4ff; }
        .aura-process-list { display: flex; flex-direction: column; gap: 2px; max-height: 500px; overflow-y: auto; }
        .aura-process-row {
          display: flex; align-items: center; gap: 12px;
          padding: 8px 12px; border-radius: 6px;
          background: rgba(0, 212, 255, 0.03);
          transition: background 0.2s;
        }
        .aura-process-row:hover { background: rgba(0, 212, 255, 0.08); }
        .aura-process-rank { font-size: 10px; color: rgba(0, 212, 255, 0.4); width: 24px; }
        .aura-process-info { flex: 1; display: flex; flex-direction: column; }
        .aura-process-name { font-size: 13px; color: #e0f0ff; }
        .aura-process-pid { font-size: 10px; color: rgba(192, 212, 232, 0.4); }
        .aura-process-metrics { display: flex; gap: 20px; align-items: center; }
        .aura-process-metric { display: flex; align-items: center; gap: 8px; min-width: 120px; }
        .aura-metric-bar-container {
          width: 60px; height: 4px; background: rgba(0, 212, 255, 0.1);
          border-radius: 2px; overflow: hidden;
        }
        .aura-metric-bar { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
        .aura-cpu-bar { background: #00d4ff; }
        .aura-mem-bar { background: #00ff88; }
        .aura-metric-value { font-size: 11px; font-family: 'Courier New', monospace; color: rgba(192, 212, 232, 0.7); min-width: 60px; }
        .aura-loading-row { text-align: center; padding: 20px; color: rgba(0, 212, 255, 0.6); font-size: 12px; letter-spacing: 1px; }
      `}</style>
    </div>
  );
};

export default ProcessList;