/**
 * AURA AI - System Dashboard Component
 * J.A.R.V.I.S.-style holographic system monitoring dashboard
 * Displays real-time CPU, RAM, Disk, Network, GPU, Processes
 */

import React, { useState, useEffect, useCallback } from 'react';
import SystemGauge from './components/SystemGauge';
import ProcessList from './components/ProcessList';
import HardwarePanel from './components/HardwarePanel';
import QuickActions from './components/QuickActions';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/pc-control';

const SystemDashboard = () => {
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/monitor/snapshot`);
      const data = await res.json();
      if (data.success) {
        setSnapshot(data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError('Connection error - PC Control API not available');
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/monitor/history?duration=30`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      // Silently fail for history
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchSnapshot(), fetchHistory()]);
      setLoading(false);
    };
    init();

    // Poll every 2 seconds for real-time updates
    const interval = setInterval(fetchSnapshot, 2000);
    return () => clearInterval(interval);
  }, [fetchSnapshot, fetchHistory]);

  if (loading) {
    return (
      <div className="aura-loading">
        <div className="aura-scan-line"></div>
        <p className="aura-loading-text">Initializing system scan...</p>
        <style>{`
          .aura-loading {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            height: 100vh; background: rgba(0, 10, 20, 0.95);
            color: #00d4ff; font-family: 'Courier New', monospace;
          }
          .aura-scan-line {
            width: 200px; height: 2px; background: linear-gradient(90deg, transparent, #00d4ff, transparent);
            animation: scanPulse 1.5s ease-in-out infinite;
            margin-bottom: 20px;
          }
          @keyframes scanPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .aura-loading-text {
            font-size: 14px; letter-spacing: 3px; text-transform: uppercase;
            opacity: 0.8; animation: textBlink 2s ease-in-out infinite;
          }
          @keyframes textBlink {
            0%, 100% { opacity: 0.5; } 50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="aura-dashboard">
      {/* Header */}
      <div className="aura-header">
        <div className="aura-header-left">
          <h1 className="aura-title">
            <span className="aura-accent">◆</span> SYSTEM CONTROL
          </h1>
          <div className="aura-status-indicator">
            <span className="aura-dot"></span>
            <span>ONLINE</span>
          </div>
        </div>
        <div className="aura-header-right">
          <span className="aura-timestamp">
            {lastUpdated?.toLocaleTimeString()}
          </span>
          <span className="aura-platform">
            {snapshot?.cpu?.model?.split(' ').slice(0, 2).join(' ') || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="aura-tabs">
        {['overview', 'hardware', 'processes', 'actions'].map(tab => (
          <button
            key={tab}
            className={`aura-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="aura-content">
        {activeTab === 'overview' && snapshot && (
          <div className="aura-overview-grid">
            {/* CPU Gauge */}
            <div className="aura-card aura-glow">
              <div className="aura-card-header">
                <span className="aura-icon">⚡</span>
                <span>CPU</span>
              </div>
              <SystemGauge
                value={snapshot.cpu?.usagePercent || 0}
                label="Usage"
                max={100}
                unit="%"
                color="#00d4ff"
                size="large"
              />
              <div className="aura-stats-row">
                <span>Cores: {snapshot.cpu?.count || '?'}</span>
                <span>Speed: {snapshot.cpu?.speed || '?'} MHz</span>
                <span>Load: {snapshot.cpu?.loadAverage?.['1min'] || '?'}</span>
              </div>
            </div>

            {/* Memory Gauge */}
            <div className="aura-card aura-glow">
              <div className="aura-card-header">
                <span className="aura-icon">💾</span>
                <span>MEMORY</span>
              </div>
              <SystemGauge
                value={parseFloat(snapshot.memory?.usagePercent) || 0}
                label="RAM Usage"
                max={100}
                unit="%"
                color="#00ff88"
                size="large"
              />
              <div className="aura-stats-row">
                <span>Used: {snapshot.memory?.usedGB || '?'} GB</span>
                <span>Free: {snapshot.memory?.freeGB || '?'} GB</span>
                <span>Total: {snapshot.memory?.totalGB || '?'} GB</span>
              </div>
            </div>

            {/* Disk Gauge */}
            <div className="aura-card aura-glow">
              <div className="aura-card-header">
                <span className="aura-icon">💿</span>
                <span>STORAGE</span>
              </div>
              <SystemGauge
                value={parseFloat(snapshot.disk?.[0]?.usagePercent) || 0}
                label="Disk Usage"
                max={100}
                unit="%"
                color="#ffaa00"
                size="large"
              />
              <div className="aura-stats-row">
                <span>Drive: {snapshot.disk?.[0]?.drive || '?'}</span>
                <span>Free: {snapshot.disk?.[0]?.freeGB || '?'} GB</span>
                <span>Total: {snapshot.disk?.[0]?.totalGB || '?'} GB</span>
              </div>
            </div>

            {/* System Info */}
            <div className="aura-card aura-glow">
              <div className="aura-card-header">
                <span className="aura-icon">🖥️</span>
                <span>SYSTEM</span>
              </div>
              <div className="aura-sysinfo">
                <div className="aura-sysinfo-row">
                  <span className="aura-label">CPU</span>
                  <span className="aura-value">{snapshot.cpu?.model?.split(' ').slice(0, 3).join(' ') || 'Unknown'}</span>
                </div>
                <div className="aura-sysinfo-row">
                  <span className="aura-label">Cores</span>
                  <span className="aura-value">{snapshot.cpu?.count || '?'}</span>
                </div>
                <div className="aura-sysinfo-row">
                  <span className="aura-label">Processes</span>
                  <span className="aura-value">{snapshot.processes?.total || '?'}</span>
                </div>
                <div className="aura-sysinfo-row">
                  <span className="aura-label">Uptime</span>
                  <span className="aura-value">{Math.floor(snapshot.uptime / 3600)}h {Math.floor((snapshot.uptime % 3600) / 60)}m</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hardware' && snapshot && (
          <HardwarePanel apiBase={API_BASE} />
        )}

        {activeTab === 'processes' && (
          <ProcessList apiBase={API_BASE} />
        )}

        {activeTab === 'actions' && (
          <QuickActions apiBase={API_BASE} />
        )}
      </div>

      {/* Global Styles */}
      <style>{`
        .aura-dashboard {
          padding: 20px;
          min-height: 100vh;
          background: linear-gradient(135deg, rgba(0, 10, 20, 0.97), rgba(0, 20, 40, 0.95));
          color: #c0d4e8;
          font-family: 'Segoe UI', -apple-system, system-ui, sans-serif;
        }
        .aura-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0 20px; border-bottom: 1px solid rgba(0, 212, 255, 0.2);
          margin-bottom: 15px;
        }
        .aura-header-left { display: flex; align-items: center; gap: 20px; }
        .aura-header-right { display: flex; align-items: center; gap: 15px; font-size: 12px; opacity: 0.7; }
        .aura-title {
          font-size: 22px; font-weight: 300; letter-spacing: 4px;
          color: #e0f0ff; margin: 0;
        }
        .aura-accent { color: #00d4ff; font-size: 18px; margin-right: 8px; }
        .aura-status-indicator { display: flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: 2px; }
        .aura-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #00ff88;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .aura-timestamp { font-family: 'Courier New', monospace; }
        
        .aura-tabs {
          display: flex; gap: 2px; margin-bottom: 20px;
          background: rgba(0, 212, 255, 0.05); border-radius: 8px; padding: 3px;
        }
        .aura-tab {
          flex: 1; padding: 10px 20px; border: none;
          background: transparent; color: rgba(192, 212, 232, 0.6);
          font-size: 12px; letter-spacing: 2px; cursor: pointer;
          border-radius: 6px; transition: all 0.3s;
        }
        .aura-tab:hover { color: #00d4ff; background: rgba(0, 212, 255, 0.1); }
        .aura-tab.active { color: #00d4ff; background: rgba(0, 212, 255, 0.15); }
        
        .aura-overview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        
        .aura-card {
          background: rgba(0, 30, 60, 0.5);
          border: 1px solid rgba(0, 212, 255, 0.15);
          border-radius: 12px; padding: 20px;
          backdrop-filter: blur(10px);
          transition: all 0.3s;
        }
        .aura-card:hover { border-color: rgba(0, 212, 255, 0.4); }
        .aura-glow { box-shadow: 0 0 20px rgba(0, 212, 255, 0.05); }
        .aura-card-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; letter-spacing: 3px; margin-bottom: 15px;
          color: rgba(0, 212, 255, 0.8);
        }
        .aura-icon { font-size: 16px; }
        .aura-stats-row {
          display: flex; justify-content: space-between;
          font-size: 11px; color: rgba(192, 212, 232, 0.6);
          margin-top: 10px; padding-top: 10px;
          border-top: 1px solid rgba(0, 212, 255, 0.1);
        }
        .aura-sysinfo { display: flex; flex-direction: column; gap: 8px; }
        .aura-sysinfo-row {
          display: flex; justify-content: space-between;
          font-size: 12px; padding: 4px 0;
          border-bottom: 1px solid rgba(0, 212, 255, 0.08);
        }
        .aura-label { color: rgba(0, 212, 255, 0.6); }
        .aura-value { font-family: 'Courier New', monospace; color: #e0f0ff; }
        
        @media (max-width: 768px) {
          .aura-overview-grid { grid-template-columns: 1fr; }
          .aura-header { flex-direction: column; gap: 10px; }
        }
      `}</style>
    </div>
  );
};

export default SystemDashboard;