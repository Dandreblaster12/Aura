// import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

const Scheduler = () => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dates = Array.from({ length: 35 }, (_, i) => i - 3);

  const scheduledTasks = [
    { date: 12, title: 'AI Automation Video', time: '10:00 AM', platform: 'YouTube' },
    { date: 12, title: 'Jarvis Setup', time: '02:00 PM', platform: 'TikTok' },
    { date: 15, title: 'Passive Income Tips', time: '09:00 AM', platform: 'Reels' },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-bold">June 2024</h3>
          <div className="flex space-x-1">
            <button className="p-1 rounded-lg hover:bg-white/5 text-white/40"><ChevronLeft className="w-5 h-5" /></button>
            <button className="p-1 rounded-lg hover:bg-white/5 text-white/40"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-jarvis-blue/20 border border-jarvis-blue/50 text-jarvis-blue rounded-lg text-xs font-bold hover:bg-jarvis-blue/30 transition-all">
          <Plus className="w-4 h-4" />
          <span>SCHEDULE POST</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden flex-1">
        {days.map(day => (
          <div key={day} className="bg-white/5 p-4 text-[10px] font-black text-white/40 text-center tracking-widest">{day}</div>
        ))}
        {dates.map((date, i) => {
          const tasks = scheduledTasks.filter(t => t.date === date);
          const isToday = date === 12;
          return (
            <div key={i} className={`min-h-[100px] bg-black/20 p-2 border-t border-l border-white/5 transition-all hover:bg-white/[0.02] ${date <= 0 || date > 30 ? 'opacity-20' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-mono ${isToday ? 'text-jarvis-blue font-black' : 'text-white/40'}`}>
                  {date > 0 && date <= 30 ? date.toString().padStart(2, '0') : ''}
                </span>
                {isToday && <div className="w-1 h-1 rounded-full bg-jarvis-blue shadow-[0_0_5px_rgba(0,180,255,1)]" />}
              </div>
              <div className="space-y-1">
                {tasks.map((task, j) => (
                  <div key={j} className="p-1.5 rounded-md bg-jarvis-blue/10 border border-jarvis-blue/30 text-[8px] font-bold text-jarvis-blue truncate cursor-pointer hover:bg-jarvis-blue/20">
                    {task.time} - {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel rounded-2xl p-4 flex justify-between items-center border-jarvis-blue/10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-jarvis-blue/30 border border-jarvis-blue/50" />
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50" />
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Published</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-white/40">
          <Clock className="w-4 h-4" />
          <span className="text-[10px] font-mono tracking-tighter">NEXT_SYNC: 04:00:00</span>
        </div>
      </div>
    </div>
  );
};

export default Scheduler;
