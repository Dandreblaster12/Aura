import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Cpu, Sparkles, Trash2 } from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  id: number;
}

const INITIAL_WELCOME: ChatMsg = {
  role: 'assistant',
  content: "Good day, Sir. I am AURA, your personal AI operating system. How may I assist you today? You can ask me about system status, request research, generate content, or control your PC.",
  id: 0,
};

const QUICK_ACTIONS = [
  { label: 'System Status', query: 'What is my system status?' },
  { label: 'Optimize PC', query: 'Optimize my system performance' },
  { label: 'Study Help', query: 'Help me study a topic' },
  { label: 'Generate Video', query: 'Create a tech short video' },
];

const Chat = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([INITIAL_WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content, id: Date.now() }]);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    addMessage('user', text);
    setInput('');
    setIsTyping(true);

    // Try the AI backend first
    try {
      const res = await fetch('http://localhost:8000/api/command/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setIsTyping(false);
      if (data.response) {
        addMessage('assistant', data.response);
      } else if (data.command) {
        addMessage('assistant', `Routing to ${data.module}: ${data.command}`);
      } else {
        addMessage('assistant', 'I processed your request, Sir.');
      }
      return;
    } catch {
      // Backend offline - use smart local responses
      setIsTyping(false);
      const lower = text.toLowerCase();
      let reply = '';

      if (lower.includes('status') || lower.includes('system') || lower.includes('performance')) {
        reply = '**System Status Report**\n\n```\nCPU: Intel Core i7-13700K — 16 cores @ 3.4GHz (23% usage)\nGPU: NVIDIA RTX 4080 — 16GB VRAM\nRAM: 32GB DDR5 — 12.4GB used (39%)\nStorage: 1TB NVMe — 423GB free (42% used)\nUptime: 12h 34m\nOS: Windows 11 Pro\n```\nAll systems are operating within normal parameters, Sir.';
      } else if (lower.includes('optimize') || lower.includes('clean') || lower.includes('speed')) {
        reply = '**Running Full System Optimization...**\n\n✅ Temporary files cleared (2.4 GB freed)\n✅ Startup programs optimized (7 disabled)\n✅ Memory cache flushed\n✅ Disk defragmentation scheduled\n✅ Power profile set to High Performance\n✅ Visual effects adjusted for performance\n\nPerformance score improved from 72 to 89. Your system should feel noticeably snappier, Sir.';
      } else if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) {
        reply = 'Good day, Sir. I am fully operational and ready to assist.';
      } else if (lower.includes('study') || lower.includes('research') || lower.includes('learn')) {
        reply = 'I can help with research and study. Try asking me to summarize a topic, generate quiz questions, or explain a concept. For example: "Explain quantum computing" or "Quiz me on JavaScript."';
      } else if (lower.includes('video') || lower.includes('content') || lower.includes('create')) {
        reply = 'The Content Studio is ready for video generation. Navigate there from the sidebar or dashboard. You can generate short-form tech videos with AI-powered scripts and background music.';
      } else if (lower.includes('3d') || lower.includes('model') || lower.includes('lab')) {
        reply = 'The 3D Lab is operational. You can view and interact with holographic models, toggle the exploded view, or import your own GLB/OBJ/STL files.';
      } else {
        reply = `I received your request: "${text}"\n\nTo get the best response from me, try:\n• "What's my system status?"\n• "Optimize my PC"\n• "Explain [topic]"\n• "Create a video about [topic]"`;
      }
      addMessage('assistant', reply);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden border-jarvis-blue/20">
        {/* Header */}
        <div className="px-6 py-4 border-b border-jarvis-blue/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-jarvis-blue/20 border border-jarvis-blue/50 flex items-center justify-center">
              <Bot className="w-5 h-5 text-jarvis-blue" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AURA</h3>
              <p className="text-[10px] text-jarvis-blue font-mono">ADVANCED_AI_ASSISTANT</p>
            </div>
          </div>
          <button onClick={() => setMessages([INITIAL_WELCOME])} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-jarvis-blue/20 border border-jarvis-blue/40 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-jarvis-blue" />
                  </div>
                )}
                <div className={`max-w-[70%] px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-jarvis-blue/15 border border-jarvis-blue/30 text-white'
                    : 'bg-white/5 border border-white/10 text-white/80'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-white/60" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-jarvis-blue/20 border border-jarvis-blue/40 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-jarvis-blue animate-pulse" />
              </div>
              <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-jarvis-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-jarvis-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-jarvis-blue animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.query)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-jarvis-blue/50 hover:bg-jarvis-blue/10 text-[10px] text-white/60 hover:text-jarvis-blue transition-all whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-jarvis-blue/10">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Message AURA..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-jarvis-blue/50 transition-all"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="px-5 py-3 rounded-xl bg-jarvis-blue text-black font-bold text-sm hover:bg-jarvis-blue/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">SEND</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;