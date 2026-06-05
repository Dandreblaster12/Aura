import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Calendar, 
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';

import VideoGenerator from './VideoGenerator';
import Scheduler from './Scheduler';
import Analytics from './Analytics';

const tabs = [
  { id: 'video', name: 'Content Engine', icon: Video },
  { id: 'calendar', name: 'Scheduler', icon: Calendar },
  { id: 'analytics', name: 'Insights', icon: BarChart3 },
];

const ContentStudio = () => {
  const [activeTab, setActiveTab] = useState('video');

  return (
    <div className="h-full flex flex-col space-y-6 p-6 overflow-hidden bg-[#020617]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black jarvis-glow italic tracking-tighter uppercase">Content Studio</h2>
          <p className="text-white/40 font-mono text-xs tracking-widest mt-1">MODULE_ACTIVE: PASSIVE_INCOME_ENGINE</p>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 rounded-lg glass-panel hover:border-jarvis-blue/50 transition-colors">
            <Settings className="w-5 h-5 text-white/60" />
          </button>
          <div className="px-4 py-2 rounded-lg glass-panel border-jarvis-blue/30 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-jarvis-blue animate-pulse" />
            <span className="text-xs font-bold text-jarvis-blue uppercase tracking-widest">AI Status: Ready</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-jarvis-blue/20 border border-jarvis-blue/50 text-jarvis-blue shadow-[0_0_15px_rgba(0,180,255,0.2)]' 
                : 'glass-panel text-white/60 hover:text-white hover:border-white/20'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'video' && <VideoGenerator />}
            {activeTab === 'calendar' && <Scheduler />}
            {activeTab === 'analytics' && <Analytics />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContentStudio;
