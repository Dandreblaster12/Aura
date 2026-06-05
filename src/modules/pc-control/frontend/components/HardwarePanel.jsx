/**
 * AURA AI - Hardware Panel Component
 * J.A.R.V.I.S.-style deep hardware scan viewer
 * Shows detailed CPU, GPU, RAM, Storage, Temperatures info
 */

import React, { useState, useEffect, useCallback } from 'react';

const HardwarePanel = ({ apiBase = 'http://localhost:3001/api/pc-control' }) => {
  const [activeScan, setActiveScan] = useState('overview');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const scans = {
    overview: { label: 'Overview', endpoint: '/hardware/system' },
    cpu: { label: 'CPU', endpoint: '/hardware/cpu' },
    gpu: { label: 'GPU', endpoint: '/hardware/gpu' },
    memory: { label: 'Memory', endpoint: '/hardware/memory' },
    storage: { label: 'Storage', endpoint: '/hardware/storage' },
    temps: { label: 'Temperatures', endpoint: '/hardware/temperatures' },
  };

  const fetchHardware = useCallback(async () => {
    try {
      const promises = Object.entries(scans).map(async ([key, scan]) => {
        try {
          const res = await fetch(`${apiBase}${scan.endpoint}`);
          const json = await res.json();
          return [key, json.success ? json.data : null];
        } catch {
          return [key, null];
        }
      });
      const results = Object.fromEntries(await Promise.all(promises));
      setData(results);
    } catch (err) {
      console.error('Hardware fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchHardware();
  }, [fetchHardware]);

  const renderContent = () => {
    if (loading) {
      return <div className="aura-loading-text">Running deep scan...</div>;
    }

    const currentData = data[activeScan];
    if (!currentData) {
      return <div className="aura-loading-text">No data available</div>;
    }

    switch (activeScan) {
      case 'overview':
        return renderOverview(currentData);
      case 'cpu':
        return renderCPUDetails(currentData);
      case 'gpu':
        return renderGPUDetails(currentData);
      case 'memory':
        return renderMemoryDetails(currentData);
      case 'storage':
        return renderStorageDetails(currentData);
      case 'temps':
        return renderTemperatureDetails(currentData);
      default:
        return null;
    }
  };

  const renderOverview = (data) => {
    const sys = data.system || {};
    const os = data.os || {};
    return (
      <div className="aura-hardware-detail">
        <div className="aura-detail-row"><span className="aura-detail-label">Hostname</span><span className="aura-detail-value">{sys.hostname || 'N/A'}</span></div>
        <div className="aura-detail-row"><span className="aura-detail-label">Platform</span><span className="aura-detail-value">{sys.platform || 'N/A'}</span></div>
        <div className="aura-detail-row"><span className="aura-detail-label">Architecture</span><span className="aura-detail-value">{sys.arch || 'N/A'}</span></div>
        <div className="aura-detail-row"><span className="aura-detail-label">OS Version</span><span className="aura-detail-value">{os.version || os.release || 'N/A'}</span></div>
        <div className="aura-detail-row"><span className="aura-detail-label">Uptime</span><span className="aura-detail-value">{os.uptime || sys.uptime ? `${Math.floor((sys.uptime || 0) / 3600)}h ${Math.floor(((sys.uptime || 0) % 3600) / 60)}m` : 'N/A'}</span></div>
        <div className="aura-detail-row"><span className="aura-detail-label">Load Average</span><span className="aura-detail-value">{sys.loadavg ? sys.loadavg.join(', ') : 'N/A'}</span></div>
      </div>
    );
  };

  const renderCPUDetails = (cpu) => (
    <div className="aura-hardware-detail">
      <div className="aura-detail-row"><span className="aura-detail-label">Model</span><span className="aura-detail-value">{cpu.model || 'Unknown'}</span></div>
      <div className="aura-detail-row"><span className="aura-detail-label">Cores</span><span className="aura-detail-value">{cpu.cores || cpu.logicalCores || '?'} logical / {cpu.physicalCores || '?'} physical</span></div>
      <div className="aura-detail-row"><span className="aura-detail-label">Clock Speed</span><span className="aura-detail-value">{cpu.speedGHz || cpu.speedMHz ? `${cpu.speedGHz || (cpu.speedMHz / 1000).toFixed(2)} GHz` : 'Unknown'}</span></div>
      <div className="aura-detail-row"><span className="aura-detail-label">Architecture</span><span className="aura-detail-value">{cpu.architecture || 'N/A'}</span></div>
      <div className="aura-detail-row"><span className="aura-detail-label">Current Usage</span><span className="aura-detail-value aura-highlight">{cpu.usagePercent ? `${cpu.usagePercent}%` : 'Unknown'}</span></div>
    </div>
  );

  const renderGPUDetails = (gpus) => {
    if (!Array.isArray(gpus)) gpus = [gpus];
    return gpus.map((gpu, i) => (
      <div key={i} className="aura-hardware-detail">
        <h4 className="aura-subtitle">GPU {i + 1}</h4>
        <div className="aura-detail-row"><span className="aura-detail-label">Name</span><span className="aura-detail-value">{gpu.name || 'Unknown'}</span></div>
        <div className="aura-detail-row"><span className="aura-detail-label">VRAM</span><span className="aura-detail-value">{gpu.vramMB ? `${gpu.vramMB} MB` : 'Unknown'}</span></div>
        {gpu.driverVersion && <div className="aura-detail-row"><span className="aura-detail-label">Driver</span><span className="aura-detail-value">{gpu.driverVersion}</span></div>}
        {gpu.tempC && <div className="aura-detail-row"><span className="aura-detail-label">Temperature</span><span className="aura-detail-value">{gpu.tempC}°C</span></div>}
        {gpu.utilization && <div className="aura-detail-row"><span className="aura-detail-label">Utilization</span><span className="aura-detail-value">{gpu.utilization}</span></div>}
      </div>
    ));
  };

  const renderMemoryDetails = (mem) => (
    <div className="aura-hardware-detail">
      <div className="aura-detail-row"><span className="aura-detail-label">Total</span><span className="aura-detail-value">{mem.totalGB ? `${mem.totalGB} GB` : 'Unknown'}</span></div>
      <div className="aura-detail-row"><span className="aura-detail-label">Used</span><span className="aura-detail-value aura-highlight">{mem.usedGB ? `${mem.usedGB} GB (${mem.usagePercent}%)` : 'Unknown'}</span></div>
      <div className="aura-detail-row"><span className="aura-detail-label">Free</span><span className="aura-detail-value">{mem.freeGB ? `${mem.freeGB} GB` : 'Unknown'}</span></div>
    </div>
  );

  const renderStorageDetails = (disks) => {
    if (!Array.isArray(disks)) disks = [disks];
    return disks.map((disk, i) => (
      <div key={i} className="aura-hardware-detail">
        <h4 className="aura-subtitle">{disk.drive || `Disk ${i + 1}`}</h4>
        <div className="aura-detail-row"><span className="aura-detail-label">Total</span><span className="aura-detail-value">{disk.totalGB ? `${disk.totalGB} GB` : 'Unknown'}</span></div>
        <div className="aura-detail-row"><span className="aura-detail-label">Used</span><span className="aura-detail-value">{disk.usedGB ? `${disk.usedGB} GB` : 'Unknown'}</span></div>
        <div className="aura-detail-row"><span className="aura-detail-label">Free</span><span className="aura-detail-value">{disk.freeGB ? `${disk.freeGB} GB` : 'Unknown'}</span></div>
        {disk.usagePercent && <div className="aura-detail-row"><span className="aura-detail-label">Usage</span><span className="aura-detail-value">{disk.usagePercent}%</span></div>}
        {disk.filesystem && <div className="aura-detail-row"><span className="aura-detail-label">File System</span><span className="aura-detail-value">{disk.filesystem}</span></div>}
      </div>
    ));
  };

  const renderTemperatureDetails = (temps) => {
    if (!Array.isArray(temps)) temps = [temps];
    if (temps.length === 0) return <div className="aura-loading-text">No temperature sensors detected</div>;
    return (
      <div className="aura-hardware-detail">
        {temps.map((t, i) => (
          <div key={i} className="aura-detail-row">
            <span className="aura-detail-label">{t.sensor || t.name || t.type || `Sensor ${i + 1}`}</span>
            <span className="aura-detail-value aura-highlight">
              {t.tempC ? `${t.tempC}°C / ${t.tempF ? `${t.tempF}°F` : ''}` : 'Unknown'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="aura-hardware-panel">
      <div className="aura-card aura-glow">
        <div className="aura-card-header">
          <span className="aura-icon">🔍</span>
          <span>HARDWARE DEEP SCAN</span>
        </div>

        {/* Scan type selector */}
        <div className="aura-scan-selector">
          {Object.entries(scans).map(([key, scan]) => (
            <button
              key={key}
              className={`aura-scan-btn ${activeScan === key ? 'active' : ''}`}
              onClick={() => setActiveScan(key)}
            >
              {scan.label}
            </button>
          ))}
        </div>

        {/* Detail content */}
        <div className="aura-scan-content">
          {renderContent()}
        </div>
      </div>

      <style>{`
        .aura-hardware-panel { max-width: 800px; margin: 0 auto; }
        .aura-scan-selector { display: flex; gap: 4px; margin-bottom: 20px; flex-wrap: wrap; }
        .aura-scan-btn {
          padding: 6px 14px; border: 1px solid rgba(0, 212, 255, 0.2);
          background: rgba(0, 212, 255, 0.05); color: rgba(192, 212, 232, 0.7);
          font-size: 11px; letter-spacing: 1px; border-radius: 4px; cursor: pointer;
          transition: all 0.2s;
        }
        .aura-scan-btn:hover { border-color: rgba(0, 212, 255, 0.4); color: #00d4ff; }
        .aura-scan-btn.active { background: rgba(0, 212, 255, 0.15); color: #00d4ff; border-color: #00d4ff; }
        .aura-scan-content { min-height: 200px; }
        .aura-hardware-detail { display: flex; flex-direction: column; gap: 6px; }
        .aura-detail-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; border-bottom: 1px solid rgba(0, 212, 255, 0.06);
          border-radius: 4px; transition: background 0.2s;
        }
        .aura-detail-row:hover { background: rgba(0, 212, 255, 0.04); }
        .aura-detail-label { font-size: 12px; color: rgba(0, 212, 255, 0.7); letter-spacing: 0.5px; }
        .aura-detail-value { font-size: 13px; font-family: 'Courier New', monospace; color: #e0f0ff; }
        .aura-highlight { color: #00d4ff; text-shadow: 0 0 10px rgba(0, 212, 255, 0.3); }
        .aura-subtitle { 
          font-size: 13px; font-weight: 400; letter-spacing: 2px;
          color: rgba(0, 212, 255, 0.8); margin: 15px 0 10px; padding-bottom: 5px;
          border-bottom: 1px solid rgba(0, 212, 255, 0.15);
        }
      `}</style>
    </div>
  );
};

export default HardwarePanel;