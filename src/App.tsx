import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import AuraConsole from './components/AuraConsole';
import ContentStudio from './modules/content-studio';
import Lab3D from './modules/3d-lab';
import PCControl from './modules/pc-control/PCControl';
import StudyLab from './modules/StudyLab';
import Chat from './modules/Chat';

interface Message {
  role: 'user' | 'aura';
  text: string;
  timestamp: number;
}

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleAuraResponse = (response: string) => {
    if (!response) return;
    const newMsg: Message = { role: 'aura', text: response, timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleCommandSubmit = (text: string) => {
    const userMsg: Message = { role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
  };

// Placeholder modules
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ cpu: 0, gpu: 0, ram: 0 });
  const [backendOnline, setBackendOnline] = useState(false);

      useEffect(() => {
        const fetchStats = async () => {
          try {
            // Try PC Control API first
            const pcRes = await fetch('http://localhost:3001/api/pc-control/monitor/snapshot');
            if (pcRes.ok) {
              const data = await pcRes.json();
              if (data.success) {
                setStats({
                  cpu: data.data.cpu?.usagePercent || 0,
                  gpu: parseFloat(data.data.gpu?.[0]?.utilization || '0'),
                  ram: parseFloat(data.data.memory?.usagePercent || '0'),
                });
                setBackendOnline(true);
                return;
              }
            }
          } catch (_e) { /* PC Control offline */ }

          try {
            // Fallback: try the AI backend
            const res = await fetch('http://localhost:8000/');
            if (res.ok) {
              setBackendOnline(true);
            }
          } catch (_e) { /* AI backend offline */ }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
      }, []);

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="col-span-2 h-64 glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
          <div className="w-32 h-32 rounded-full border-2 border-jarvis-blue/20 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-jarvis-blue/40 flex items-center justify-center animate-spin-slow">
              <div className="w-16 h-16 rounded-full bg-jarvis-blue/10 border border-jarvis-blue shadow-[0_0_20px_rgba(0,180,255,0.4)]" />
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold jarvis-glow mb-2">Welcome, Sir.</h2>
                    <p className="text-white/60 max-w-md italic font-light tracking-wide">
                      "All systems are operational. I've optimized your workspace for peak performance."
                    </p>
                    <div className="mt-4 flex gap-3">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${backendOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        AI Backend: {backendOnline ? 'Online' : 'Offline'}
                      </span>
                      <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-jarvis-blue/20 text-jarvis-blue">
                        Web Mode
                      </span>
                    </div>
      </div>
      <div className="h-64 glass-panel rounded-3xl p-6">
        <h3 className="text-sm font-bold text-jarvis-blue mb-4 tracking-widest uppercase">System Stats</h3>
        <div className="space-y-4">
          {[
            { label: 'CPU', value: stats.cpu },
            { label: 'GPU', value: stats.gpu },
            { label: 'RAM', value: stats.ram }
          ].map((stat) => (
            <div key={stat.label}>
              <div className="flex justify-between text-[10px] mb-1 font-bold">
                <span>{stat.label}</span>
                <span className="text-jarvis-blue">{Math.round(stat.value)}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.value}%` }}
                  className="h-full bg-jarvis-blue"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {[{ name: 'Study Lab', path: '/study' }, { name: '3D Lab', path: '/3d-lab' }, { name: 'PC Control', path: '/pc-control' }, { name: 'Content Studio', path: '/content' }, { name: 'Chat', path: '/chat' }].map((module) => (
            <div key={module.name} onClick={() => navigate(module.path)} className="h-48 glass-panel rounded-3xl p-6 hover:border-jarvis-blue/60 transition-all cursor-pointer group">
              <h3 className="text-lg font-bold mb-2 group-hover:text-jarvis-blue transition-colors">{module.name}</h3>
              <p className="text-xs text-white/40">Access advanced {module.name.toLowerCase()} capabilities and AI assistance.</p>
            </div>
      ))}
    </div>
  );
};

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleAuraResponse = (response: string) => {
    if (!response) return;
    const newMsg: Message = { role: 'aura', text: response, timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleCommandSubmit = (text: string) => {
    const userMsg: Message = { role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
  };

  return (
    <Router>
      <div className="flex h-screen w-screen bg-[#020617] text-white overflow-hidden p-2">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onAuraResponse={handleAuraResponse} onCommandSubmit={handleCommandSubmit} />
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Dashboard />
                  </motion.div>
                } />
                <Route path="/3d-lab" element={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 h-full"
                  >
                    <Lab3D />
                  </motion.div>
                } />
                <Route path="/content" element={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 h-full"
                  >
                    <ContentStudio />
                  </motion.div>
                } />
                <Route path="/study" element={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 h-full"
                  >
                    <StudyLab />
                  </motion.div>
                } />
                <Route path="/pc-control" element={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 h-full overflow-y-auto no-scrollbar"
                  >
                    <PCControl />
                  </motion.div>
                } />
                {['settings'].map((path) => (
                  <Route key={path} path={`/${path}`} element={
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="p-10 flex flex-col items-center justify-center h-full"
                    >
                      <h2 className="text-4xl font-black italic tracking-tighter jarvis-glow uppercase mb-4">
                        {path.replace('-', ' ')}
                      </h2>
                      <div className="w-20 h-1 bg-jarvis-blue shadow-[0_0_10px_rgba(0,180,255,1)]" />
                      <p className="mt-8 text-white/40 font-mono text-sm tracking-widest">INITIALIZING MODULE_INTERFACE...</p>
                    </motion.div>
                  } />
                ))}
                <Route path="/chat" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="h-full"><Chat /></motion.div>} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
        <AuraConsole messages={messages} />
      </div>
    </Router>
  );
};

export default App;
