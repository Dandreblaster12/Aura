import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Monitor,
  HardDrive,
  Thermometer,
  Search,
  Zap,
  Trash2,
  Gauge,
  RefreshCw,
  Box,
  Terminal,
  FolderOpen,
  Play,
  X,
  ArrowUp,
  ArrowDown,
  Activity,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface SystemSnapshot {
  cpu: { usagePercent: number; count: number; model: string; speed: number; cores: { core: number; usagePercent: string }[]; loadAverage: Record<string, string> };
  memory: { usagePercent: string; totalGB: string; usedGB: string; freeGB: string };
  disk: { drive: string; usagePercent: string; totalGB: string; freeGB: string }[];
  gpu: { name: string; utilization?: string }[];
  processes: { total: number; running: number };
  uptime: number;
  temperatures: { name: string; tempC: string }[];
}

interface HardwareInfo {
  cpu?: { model: string; cores: number; physicalCores: number; speedGHz: string; usagePercent: number };
  gpu?: { name: string; vramMB: string | number; driverVersion?: string }[];
  memory?: { totalGB: string; usedGB: string; freeGB: string; usagePercent: string };
  storage?: { drive: string; totalGB: string; usedGB: string; freeGB: string; usagePercent: string }[];
  temps?: { sensor: string; tempC: string; type: string }[];
  os?: { platform: string; version: string; kernel: string; uptime: string };
}

// ─── Constants ──────────────────────────────────────────────────────

const API_BASE = 'http://localhost:3001/api/pc-control';
const POLL_INTERVAL = 3000; // 3 seconds

// ─── Gauges ─────────────────────────────────────────────────────────

const HolographicGauge: React.FC<{ value: number; label: string; max?: number; unit?: string; color?: string; size?: number }> = ({
  value, label, max = 100, unit = '%', color = '#00B4FF', size = 140,
}) => {
  const radius = size * 0.35;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`} className="drop-shadow-[0_0_12px_rgba(0,180,255,0.3)]">
        {/* Background arc */}
        <path
          d={`M ${size * 0.1} ${size * 0.7} A ${radius} ${radius} 0 0 1 ${size * 0.9} ${size * 0.7}`}
          fill="none" stroke="rgba(0,180,255,0.1)" strokeWidth="8" strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${size * 0.1} ${size * 0.7} A ${radius} ${radius} 0 0 1 ${size * 0.9} ${size * 0.7}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Center value */}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="28" fontFamily="'Courier New', monospace" fontWeight="300"
        >
          {value.toFixed(1)}
        </text>
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="monospace"
        >
          {unit}
        </text>
      </svg>
      <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

// ─── Mini Bar ───────────────────────────────────────────────────────

const MiniBar: React.FC<{ value: number; color?: string; height?: number }> = ({ value, color = '#00B4FF', height = 4 }) => (
  <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(0,180,255,0.08)' }}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(value, 100)}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="h-full rounded-full"
      style={{ background: `linear-gradient(90deg, ${color}44, ${color})`, boxShadow: `0 0 8px ${color}` }}
    />
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────

const PCControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'optimizer' | 'launcher'>('overview');
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [hardware, setHardware] = useState<HardwareInfo>({});
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<string | null>(null);
  const [launcherQuery, setLauncherQuery] = useState('');
  const [launcherResults, setLauncherResults] = useState<any[]>([]);
  const [launchFeedback, setLaunchFeedback] = useState<string | null>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // ── Fetch snapshot ──────────────────────────────────────────────

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/monitor/snapshot`);
      const json = await res.json();
      if (json.success) setSnapshot(json.data);
    } catch { /* server may not be running */ }
  }, []);

  const fetchHardware = useCallback(async () => {
    try {
      const [cpuRes, gpuRes, memRes, storageRes, tempsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/hardware/cpu`),
        fetch(`${API_BASE}/hardware/gpu`),
        fetch(`${API_BASE}/hardware/memory`),
        fetch(`${API_BASE}/hardware/storage`),
        fetch(`${API_BASE}/hardware/temperatures`),
      ]);

      const parse = async (r: PromiseSettledResult<Response>) =>
        r.status === 'fulfilled' ? (await r.value.json()).data : null;

      setHardware({
        cpu: await parse(cpuRes),
        gpu: await parse(gpuRes),
        memory: await parse(memRes),
        storage: await parse(storageRes),
        temps: await parse(tempsRes),
      });
    } catch { /* ignore */ }
  }, []);

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/hardware/processes?limit=8`);
      const json = await res.json();
      if (json.success) setProcesses(json.data);
    } catch { /* ignore */ }
  }, []);

  // ── Live polling ─────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchSnapshot(), fetchHardware(), fetchProcesses()]);
      setLoading(false);
    };
    init();

    pollRef.current = setInterval(() => {
      fetchSnapshot();
      fetchProcesses();
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [fetchSnapshot, fetchHardware, fetchProcesses]);

  // ── Optimizer ────────────────────────────────────────────────────

  const runOptimization = async () => {
    setOptimizing(true);
    setOptResult(null);
    try {
      const res = await fetch(`${API_BASE}/optimize/full`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setOptResult(
          `✅ Full optimization complete!\n` +
          `• Temp files cleaned: ${d.tempCleanup?.filesCleaned ?? 0}\n` +
          `• Disk actions: ${d.diskCleanup?.count ?? 0}\n` +
          `• Performance tweaks: ${d.performanceTuning?.count ?? 0}\n` +
          `• Score: ${d.afterScore?.overall ?? '?'}/100`
        );
      } else {
        setOptResult(`❌ Optimization failed: ${json.error}`);
      }
    } catch {
      setOptResult('❌ Could not connect to PC Control API');
    } finally {
      setOptimizing(false);
    }
  };

  const runQuickAction = async (endpoint: string, label: string) => {
    setOptResult(`⟳ Running ${label}...`);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        const msg = json.data?.message || json.data?.changes?.join(', ') || 'Complete';
        setOptResult(`✅ ${label}: ${msg}`);
      } else {
        setOptResult(`❌ ${label}: ${json.error}`);
      }
    } catch {
      setOptResult(`❌ ${label}: Connection failed`);
    }
  };

  // ── App Launcher ─────────────────────────────────────────────────

  const searchApps = async (q: string) => {
    setLauncherQuery(q);
    if (q.length < 2) { setLauncherResults([]); return; }
    try {
      const res = await fetch(`${API_BASE}/launch/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) setLauncherResults(json.data.slice(0, 10));
    } catch { /* ignore */ }
  };

  const launchApp = async (name: string) => {
    setLaunchFeedback(`Launching ${name}...`);
    try {
      const res = await fetch(`${API_BASE}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: name }),
      });
      const json = await res.json();
      setLaunchFeedback(json.success ? `✅ Launched ${name}` : `❌ Failed: ${json.error}`);
    } catch {
      setLaunchFeedback('❌ Connection failed');
    }
    setTimeout(() => setLaunchFeedback(null), 3000);
  };

  // ── Helper ───────────────────────────────────────────────────────

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // ── Loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-16 h-16 border-2 border-jarvis-blue/30 border-t-jarvis-blue rounded-full"
        />
        <div className="text-jarvis-blue font-mono text-xs tracking-widest animate-pulse">INITIALIZING PC_CONTROL_MODULE</div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden p-6 gap-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="text-[10px] text-jarvis-blue font-bold tracking-widest uppercase mb-1">Module // PC_CONTROL</div>
          <h1 className="text-2xl font-bold jarvis-glow tracking-wider">COMMAND_CENTER</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full text-[10px]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono tracking-wider text-white/60">
              {snapshot ? `ONLINE • ${snapshot.cpu.count} CORES` : 'OFFLINE'}
            </span>
          </div>
          <button onClick={() => { fetchSnapshot(); fetchHardware(); fetchProcesses(); }}
            className="glass-panel p-2.5 rounded-xl hover:border-jarvis-blue/50 transition-all text-white/60 hover:text-jarvis-blue"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </motion.div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 glass-panel p-1 rounded-2xl w-fit">
        {(['overview', 'hardware', 'optimizer', 'launcher'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all duration-300
              ${activeTab === tab
                ? 'bg-jarvis-blue/20 text-jarvis-blue border border-jarvis-blue/40 shadow-[0_0_10px_rgba(0,180,255,0.2)]'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'hardware' && '🔍 Hardware'}
            {tab === 'optimizer' && '⚡ Optimizer'}
            {tab === 'launcher' && '🚀 Launcher'}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >

            {/* ════════════ OVERVIEW ════════════ */}
            {activeTab === 'overview' && snapshot && (
              <>
                {/* Gauges row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel rounded-2xl p-6 flex flex-col items-center border-l-4 border-l-jarvis-blue">
                    <HolographicGauge
                      value={snapshot.cpu?.usagePercent ?? 0}
                      label="CPU"
                      color="#00B4FF"
                    />
                    <div className="mt-3 text-[10px] text-white/40 font-mono w-full text-center">
                      {snapshot.cpu?.model?.split(' ').slice(0, 2).join(' ') || 'Unknown'} • {snapshot.cpu?.speed}MHz
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-6 flex flex-col items-center border-l-4 border-l-emerald-500">
                    <HolographicGauge
                      value={parseFloat(snapshot.memory?.usagePercent ?? '0')}
                      label="RAM"
                      color="#10B981"
                    />
                    <div className="mt-3 text-[10px] text-white/40 font-mono w-full text-center">
                      {snapshot.memory?.usedGB}/{snapshot.memory?.totalGB} GB
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-6 flex flex-col items-center border-l-4 border-l-amber-500">
                    <HolographicGauge
                      value={parseFloat(snapshot.disk?.[0]?.usagePercent ?? '0')}
                      label="DISK"
                      color="#F59E0B"
                    />
                    <div className="mt-3 text-[10px] text-white/40 font-mono w-full text-center">
                      {snapshot.disk?.[0]?.drive} • {snapshot.disk?.[0]?.freeGB} GB free
                    </div>
                  </div>
                </div>

                {/* System info + Processes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* System Info */}
                  <div className="glass-panel rounded-2xl p-5">
                    <h3 className="text-[10px] text-jarvis-blue font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                      <Monitor size={14} /> SYSTEM INFO
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        ['CPU', snapshot.cpu?.model?.substring(0, 40) || 'Unknown'],
                        ['Cores', `${snapshot.cpu?.count} logical`],
                        ['RAM', `${snapshot.memory?.totalGB} GB`],
                        ['Uptime', formatUptime(snapshot.uptime)],
                        ['Processes', `${snapshot.processes?.total ?? '?'} total`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                          <span className="text-white/40">{k}</span>
                          <span className="text-white/80 font-mono">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Processes */}
                  <div className="glass-panel rounded-2xl p-5">
                    <h3 className="text-[10px] text-jarvis-blue font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                      <Terminal size={14} /> TOP PROCESSES
                    </h3>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {processes.length === 0 && (
                        <div className="text-[10px] text-white/30 font-mono text-center py-8">No process data</div>
                      )}
                      {processes.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 py-1.5">
                          <span className="text-[9px] text-white/30 font-mono w-5 text-right">#{i + 1}</span>
                          <span className="flex-1 text-[11px] text-white/70 truncate">{p.name || p.Name || 'Unknown'}</span>
                          <div className="flex items-center gap-4 text-[10px] font-mono">
                            <span className="text-jarvis-blue w-10 text-right">{p.cpuPercent ?? '?'}%</span>
                            <span className="text-emerald-400 w-16 text-right">{p.memoryMB ? `${p.memoryMB}MB` : p.memoryPercent ? `${p.memoryPercent}%` : '?'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════════════ HARDWARE ════════════ */}
            {activeTab === 'hardware' && (
              <div className="space-y-6">
                {/* Deep Scan Button */}
                <div className="flex items-center gap-4">
                  <button onClick={() => { fetchHardware(); }}
                    className="glass-panel px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase
                      text-jarvis-blue hover:bg-jarvis-blue/10 transition-all border border-jarvis-blue/30 flex items-center gap-2"
                  >
                    <Search size={14} /> Run Deep Scan
                  </button>
                  <span className="text-[10px] text-white/30 font-mono">Scans CPU, GPU, RAM, Storage, Temperatures</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CPU */}
                  <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-jarvis-blue">
                    <h3 className="text-[10px] text-jarvis-blue font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                      <Cpu size={14} /> CPU
                    </h3>
                    {hardware.cpu ? (
                      <div className="space-y-2">
                        {[
                          ['Model', hardware.cpu.model],
                          ['Cores', `${hardware.cpu.cores} logical / ${hardware.cpu.physicalCores ?? '?'} physical`],
                          ['Speed', `${hardware.cpu.speedGHz ?? '?'} GHz`],
                          ['Usage', `${hardware.cpu.usagePercent}%`],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                            <span className="text-white/40">{k}</span>
                            <span className="text-white/80 font-mono">{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-white/30 font-mono py-6 text-center">No CPU data</div>
                    )}
                  </div>

                  {/* GPU */}
                  <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-purple-500">
                    <h3 className="text-[10px] text-purple-400 font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                      <Monitor size={14} /> GPU
                    </h3>
                    {hardware.gpu && hardware.gpu.length > 0 ? (
                      hardware.gpu.map((g: any, i: number) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                            <span className="text-white/40">Model</span>
                            <span className="text-white/80 font-mono">{g.name}</span>
                          </div>
                          <div className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                            <span className="text-white/40">VRAM</span>
                            <span className="text-white/80 font-mono">{typeof g.vramMB === 'number' ? `${g.vramMB} MB` : g.vramMB || 'Unknown'}</span>
                          </div>
                          {g.driverVersion && (
                            <div className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                              <span className="text-white/40">Driver</span>
                              <span className="text-white/80 font-mono">{g.driverVersion}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-white/30 font-mono py-6 text-center">No GPU data</div>
                    )}
                  </div>

                  {/* Memory */}
                  <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-emerald-500">
                    <h3 className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                      <Activity size={14} /> MEMORY
                    </h3>
                    {hardware.memory ? (
                      <div className="space-y-2">
                        {[
                          ['Total', `${hardware.memory.totalGB} GB`],
                          ['Used', `${hardware.memory.usedGB} GB`],
                          ['Free', `${hardware.memory.freeGB} GB`],
                          ['Usage', `${hardware.memory.usagePercent}%`],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                            <span className="text-white/40">{k}</span>
                            <span className="text-white/80 font-mono">{v}</span>
                          </div>
                        ))}
                        <MiniBar value={parseFloat(hardware.memory.usagePercent)} color="#10B981" />
                      </div>
                    ) : (
                      <div className="text-[10px] text-white/30 font-mono py-6 text-center">No memory data</div>
                    )}
                  </div>

                  {/* Storage */}
                  <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-amber-500">
                    <h3 className="text-[10px] text-amber-400 font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                      <HardDrive size={14} /> STORAGE
                    </h3>
                    {hardware.storage && hardware.storage.length > 0 ? (
                      hardware.storage.map((d: any, i: number) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between text-xs border-b border-white/5 pb-1.5">
                            <span className="text-white/40">{d.drive || `Disk ${i + 1}`}</span>
                            <span className="text-white/80 font-mono">{d.totalGB} GB</span>
                          </div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/40">{d.usedGB} GB used</span>
                            <span className="text-white/60">{d.freeGB} GB free</span>
                          </div>
                          <MiniBar value={parseFloat(d.usagePercent)} color="#F59E0B" />
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-white/30 font-mono py-6 text-center">No storage data</div>
                    )}
                  </div>

                  {/* Temperatures */}
                  <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-red-500 lg:col-span-2">
                    <h3 className="text-[10px] text-red-400 font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                      <Thermometer size={14} /> TEMPERATURES
                    </h3>
                    {hardware.temps && hardware.temps.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {hardware.temps.map((t: any, i: number) => (
                          <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
                            <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">{t.sensor || t.name || t.type}</div>
                            <div className="text-lg font-bold font-mono" style={{ color: parseFloat(t.tempC) > 70 ? '#EF4444' : parseFloat(t.tempC) > 50 ? '#F59E0B' : '#10B981' }}>
                              {t.tempC}°C
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-white/30 font-mono py-6 text-center">
                        No temperature sensors detected. {hardware.cpu && `CPU estimated: ${(35 + (hardware.cpu.usagePercent || 0) * 0.3).toFixed(1)}°C`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════ OPTIMIZER ════════════ */}
            {activeTab === 'optimizer' && (
              <div className="space-y-6">
                {/* Result banner */}
                <AnimatePresence>
                  {optResult && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="glass-panel rounded-2xl p-4 border-l-4 border-l-jarvis-blue"
                    >
                      <pre className="text-xs font-mono text-white/80 whitespace-pre-wrap">{optResult}</pre>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Full Optimize */}
                <div className="glass-panel rounded-2xl p-6 text-center">
                  <Zap size={40} className="mx-auto mb-3 text-jarvis-blue drop-shadow-[0_0_10px_rgba(0,180,255,0.5)]" />
                  <h2 className="text-lg font-bold jarvis-glow mb-1">FULL SYSTEM OPTIMIZATION</h2>
                  <p className="text-[11px] text-white/40 mb-6 max-w-md mx-auto">
                    Clean temporary files, optimize startup programs, apply performance tweaks, and free up memory.
                  </p>
                  <button onClick={runOptimization} disabled={optimizing}
                    className={`px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300
                      ${optimizing
                        ? 'bg-jarvis-blue/20 text-white/50 cursor-wait'
                        : 'bg-jarvis-blue/20 text-jarvis-blue border border-jarvis-blue/50 hover:bg-jarvis-blue/30 shadow-[0_0_20px_rgba(0,180,255,0.15)]'}`}
                  >
                    {optimizing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" /> OPTIMIZING...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2"><Zap size={14} /> RUN OPTIMIZATION</span>
                    )}
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Clean Temp Files', icon: Trash2, endpoint: '/optimize/clean-temp', color: '#EF4444' },
                    { label: 'Tune Performance', icon: Gauge, endpoint: '/optimize/performance', color: '#10B981' },
                    { label: 'Optimize Memory', icon: Activity, endpoint: '/optimize/memory', color: '#8B5CF6' },
                    { label: 'Disk Cleanup', icon: HardDrive, endpoint: '/optimize/disk', color: '#F59E0B' },
                    { label: 'Startup Optimize', icon: Zap, endpoint: '/optimize/startup', color: '#00B4FF' },
                    { label: 'Check Score', icon: Terminal, endpoint: '/optimize/score', method: 'GET', color: '#EC4899' },
                  ].map(action => {
                    const Icon = action.icon;
                    return (
                      <button key={action.label} onClick={() => runQuickAction(action.endpoint, action.label)}
                        className="glass-panel rounded-2xl p-4 hover:border-jarvis-blue/40 transition-all text-left group"
                      >
                        <Icon size={20} className="mb-2 transition-colors" style={{ color: action.color }} />
                        <div className="text-xs font-bold tracking-wider text-white/70 group-hover:text-white transition-colors">{action.label}</div>
                        <div className="text-[9px] text-white/30 font-mono mt-1">Click to run</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════ LAUNCHER ════════════ */}
            {activeTab === 'launcher' && (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Search bar */}
                <div className="glass-panel rounded-2xl p-1 flex items-center gap-2 border-jarvis-blue/20 focus-within:border-jarvis-blue/60 transition-all">
                  <Search size={16} className="ml-4 text-white/30" />
                  <input
                    value={launcherQuery}
                    onChange={e => searchApps(e.target.value)}
                    placeholder="Search applications by name... (e.g. 'chrome', 'vscode')"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-white/80 outline-none font-mono placeholder:text-white/20"
                  />
                  {launcherQuery && (
                    <button onClick={() => { setLauncherQuery(''); setLauncherResults([]); }}
                      className="mr-2 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Quick Launch Buttons */}
                <div className="flex flex-wrap gap-2">
                  {['Chrome', 'Firefox', 'Edge', 'VS Code', 'Terminal', 'Spotify', 'Discord', 'Slack', 'Calculator', 'Notepad'].map(app => (
                    <button key={app} onClick={() => launchApp(app)}
                      className="glass-panel px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase
                        text-white/60 hover:text-jarvis-blue hover:border-jarvis-blue/40 transition-all flex items-center gap-1.5"
                    >
                      <Play size={10} /> {app}
                    </button>
                  ))}
                </div>

                {/* Launch feedback */}
                <AnimatePresence>
                  {launchFeedback && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="glass-panel rounded-xl px-4 py-3 text-xs font-mono text-jarvis-blue text-center border border-jarvis-blue/30"
                    >
                      {launchFeedback}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Results */}
                {launcherResults.length > 0 && (
                  <div className="glass-panel rounded-2xl p-4">
                    <h3 className="text-[10px] text-white/40 font-bold tracking-widest uppercase mb-3">Results</h3>
                    <div className="space-y-1">
                      {launcherResults.map((app: any, i: number) => (
                        <button key={i} onClick={() => launchApp(app.name)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                        >
                          <Box size={14} className="text-jarvis-blue/40 group-hover:text-jarvis-blue transition-colors" />
                          <span className="text-xs text-white/70 group-hover:text-white transition-colors flex-1">{app.name}</span>
                          <span className="text-[9px] text-white/20 font-mono">{app.path ? 'Shortcut' : app.exec ? 'Application' : ''}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {launcherQuery.length >= 2 && launcherResults.length === 0 && (
                  <div className="text-center text-[11px] text-white/30 font-mono py-8">
                    No applications found for "{launcherQuery}"
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};

export default PCControl;