/**
 * AURA AI - Quick Actions Component
 * J.A.R.V.I.S.-style system control panel
 * One-click optimization, cleanup, and system actions
 */

import React, { useState } from 'react';

const QuickActions = ({ apiBase = 'http://localhost:3001/api/pc-control' }) => {
  const [running, setRunning] = useState(null);
  const [results, setResults] = useState({});
  const [showResults, setShowResults] = useState({});

  const actions = [
    {
      id: 'full-optimize',
      label: 'FULL OPTIMIZATION',
      desc: 'Run complete system optimization (temp cleanup, startup, performance, memory)',
      icon: '🚀',
      endpoint: '/optimize/full',
      method: 'POST',
      color: '#00d4ff',
    },
    {
      id: 'clean-temp',
      label: 'CLEAN TEMP FILES',
      desc: 'Remove temporary files and browser caches',
      icon: '🧹',
      endpoint: '/optimize/clean-temp',
      method: 'POST',
      color: '#00ff88',
    },
    {
      id: 'optimize-startup',
      label: 'OPTIMIZE STARTUP',
      desc: 'Disable non-essential startup programs',
      icon: '⚡',
      endpoint: '/optimize/startup',
      method: 'POST',
      color: '#ffaa00',
    },
    {
      id: 'tune-performance',
      label: 'PERFORMANCE TUNE',
      desc: 'Apply system performance tweaks',
      icon: '🔧',
      endpoint: '/optimize/performance',
      method: 'POST',
      color: '#ff66aa',
    },
    {
      id: 'clean-disk',
      label: 'DISK CLEANUP',
      desc: 'Empty trash and clear system caches',
      icon: '💿',
      endpoint: '/optimize/disk',
      method: 'POST',
      color: '#aa66ff',
    },
    {
      id: 'optimize-memory',
      label: 'OPTIMIZE MEMORY',
      desc: 'Free up RAM and reduce memory pressure',
      icon: '💾',
      endpoint: '/optimize/memory',
      method: 'POST',
      color: '#66ffcc',
    },
    {
      id: 'check-score',
      label: 'PERFORMANCE SCORE',
      desc: 'Calculate current system performance score',
      icon: '📊',
      endpoint: '/optimize/score',
      method: 'GET',
      color: '#ffcc00',
    },
  ];

  const runAction = async (action) => {
    setRunning(action.id);
    setShowResults(prev => ({ ...prev, [action.id]: true }));
    setResults(prev => ({ ...prev, [action.id]: { status: 'running', message: 'Running...' } }));

    try {
      const options = {
        method: action.method,
        headers: { 'Content-Type': 'application/json' },
      };
      const res = await fetch(`${apiBase}${action.endpoint}`, options);
      const data = await res.json();
      
      setResults(prev => ({
        ...prev,
        [action.id]: {
          status: data.success ? 'success' : 'error',
          message: data.success ? formatResult(data.data) : data.error,
          data: data.data,
        },
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [action.id]: { status: 'error', message: 'Connection failed - API not available' },
      }));
    } finally {
      setRunning(null);
    }
  };

  const formatResult = (data) => {
    if (!data) return 'Completed';
    if (data.message) return data.message;
    if (data.filesCleaned !== undefined) return `Cleaned ${data.filesCleaned} files (${data.spaceFreedMB || 0} MB)`;
    if (data.overall !== undefined) return `Score: ${data.overall}/100`;
    if (data.changes && Array.isArray(data.changes)) return data.changes.join(', ');
    if (data.count !== undefined) return `${data.count} actions performed`;
    return 'Optimization complete';
  };

  return (
    <div className="aura-actions-panel">
      <div className="aura-actions-grid">
        {actions.map(action => (
          <div key={action.id} className="aura-card aura-glow aura-action-card">
            <div className="aura-action-icon" style={{ color: action.color }}>
              {action.icon}
            </div>
            <div className="aura-action-info">
              <h3 className="aura-action-label" style={{ color: action.color }}>{action.label}</h3>
              <p className="aura-action-desc">{action.desc}</p>
            </div>
            <button
              className="aura-action-btn"
              style={{
                borderColor: action.color,
                color: running === action.id ? '#fff' : action.color,
                background: running === action.id ? action.color : 'transparent',
                opacity: running && running !== action.id ? 0.5 : 1,
              }}
              onClick={() => runAction(action)}
              disabled={running !== null}
            >
              {running === action.id ? (
                <span className="aura-spin">⟳</span>
              ) : (
                'EXECUTE'
              )}
            </button>
            
            {showResults[action.id] && results[action.id] && (
              <div className={`aura-action-result ${results[action.id].status}`}>
                <span className="aura-result-icon">
                  {results[action.id].status === 'running' ? '⟳' :
                   results[action.id].status === 'success' ? '✓' : '✗'}
                </span>
                <span className="aura-result-text">{results[action.id].message}</span>
                <button
                  className="aura-result-close"
                  onClick={() => setShowResults(prev => ({ ...prev, [action.id]: false }))}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .aura-actions-panel { max-width: 800px; margin: 0 auto; }
        .aura-actions-grid { display: flex; flex-direction: column; gap: 12px; }
        .aura-action-card {
          display: flex; align-items: center; gap: 15px; padding: 16px 20px;
          position: relative; overflow: hidden;
        }
        .aura-action-icon { font-size: 28px; min-width: 44px; text-align: center; }
        .aura-action-info { flex: 1; }
        .aura-action-label { font-size: 13px; font-weight: 500; letter-spacing: 2px; margin: 0 0 4px; }
        .aura-action-desc { font-size: 11px; color: rgba(192, 212, 232, 0.5); margin: 0; }
        .aura-action-btn {
          padding: 8px 20px; border: 1px solid; border-radius: 6px;
          font-size: 11px; letter-spacing: 2px; cursor: pointer;
          transition: all 0.3s; white-space: nowrap;
          min-width: 90px; text-align: center;
        }
        .aura-action-btn:hover:not(:disabled) {
          filter: brightness(1.2); transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.2);
        }
        .aura-action-btn:disabled { cursor: not-allowed; }
        .aura-spin { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .aura-action-result {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 8px 16px; display: flex; align-items: center; gap: 8px;
          font-size: 11px; animation: slideUp 0.3s ease;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .aura-action-result.success { background: rgba(0, 255, 136, 0.1); color: #00ff88; }
        .aura-action-result.error { background: rgba(255, 51, 85, 0.1); color: #ff3355; }
        .aura-action-result.running { background: rgba(0, 212, 255, 0.1); color: #00d4ff; }
        .aura-result-close {
          margin-left: auto; background: none; border: none;
          color: inherit; cursor: pointer; font-size: 16px; opacity: 0.6;
        }
        .aura-result-close:hover { opacity: 1; }
      `}</style>
    </div>
  );
};

export default QuickActions;