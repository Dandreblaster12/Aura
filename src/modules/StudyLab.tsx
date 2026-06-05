import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GraduationCap, Box, Terminal, Video } from 'lucide-react';

const StudyLab = () => {
  return (
    <div className="h-full flex flex-col space-y-6 p-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black jarvis-glow italic tracking-tighter uppercase">Study Lab</h2>
          <p className="text-white/40 font-mono text-xs tracking-widest mt-1">MODULE_ACTIVE: RESEARCH_AND_ANALYSIS</p>
        </div>
        <div className="px-4 py-2 rounded-lg glass-panel border-jarvis-blue/30 flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-jarvis-blue" />
          <span className="text-xs font-bold text-jarvis-blue uppercase tracking-widest">Academic Mode: ON</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto no-scrollbar">
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <h3 className="text-xl font-bold jarvis-glow">Research Assistant</h3>
          <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-4 font-mono text-sm text-white/60 italic">
            "Sir, upload a document or provide a topic, and I will begin the deep-scan and summarization process immediately."
          </div>
          <button className="w-full py-3 bg-jarvis-blue/20 hover:bg-jarvis-blue/30 border border-jarvis-blue/50 rounded-xl font-bold text-jarvis-blue transition-all">
            UPLOAD DATA_STREAM
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <h3 className="text-xl font-bold jarvis-glow">Quiz Generator</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center group hover:border-jarvis-blue/50 transition-colors cursor-pointer">
                <span className="text-sm font-medium text-white/80">Previous Quiz Session {i}</span>
                <span className="text-xs font-bold text-jarvis-blue opacity-0 group-hover:opacity-100 transition-opacity">REVIEW</span>
              </div>
            ))}
          </div>
          <button className="mt-auto w-full py-3 glass-panel hover:bg-white/5 border-white/10 rounded-xl font-bold text-white/60 transition-all">
            GENERATE NEW_QUIZ
          </button>
        </div>

        <div className="md:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-bold jarvis-glow mb-4">Study Insights</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Topics Mastered', value: '12' },
              { label: 'Hours Studied', value: '42.5' },
              { label: 'Average Score', value: '94%' }
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-2xl font-black text-jarvis-blue">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyLab;
