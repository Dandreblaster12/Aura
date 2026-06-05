import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Cpu } from 'lucide-react';

interface Message {
  role: 'user' | 'aura';
  text: string;
  timestamp: number;
}

interface AuraConsoleProps {
  messages: Message[];
}

const AuraConsole = ({ messages }: AuraConsoleProps) => {
  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-80 overflow-y-auto glass-panel rounded-2xl border-jarvis-blue/30 shadow-[0_0_30px_rgba(0,180,255,0.15)]">
      <div className="px-4 py-3 border-b border-jarvis-blue/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-jarvis-blue animate-pulse" />
          <span className="text-[10px] font-bold text-jarvis-blue uppercase tracking-widest">AURA Response</span>
        </div>
        <span className="text-[8px] text-white/30 font-mono">{messages.length} messages</span>
      </div>
      <div className="p-3 space-y-3">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.timestamp}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-jarvis-blue/20 border border-jarvis-blue/40' : 'bg-green-500/20 border border-green-500/40'
                }`}>
                  {msg.role === 'user' ? <User size={12} className="text-jarvis-blue" /> : <Bot size={12} className="text-green-400" />}
                </div>
                <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-jarvis-blue/10 border border-jarvis-blue/20 text-white/80' 
                    : 'bg-green-500/5 border border-green-500/20 text-green-300 font-mono'
                }`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuraConsole;
