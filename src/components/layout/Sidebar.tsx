import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Box, 
  Terminal, 
  Video, 
  Settings,
  MessageCircle
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <BookOpen size={20} />, label: 'Study Lab', path: '/study' },
    { icon: <Box size={20} />, label: '3D Lab', path: '/3d-lab' },
    { icon: <Terminal size={20} />, label: 'PC Control', path: '/pc-control' },
    { icon: <Video size={20} />, label: 'Content Studio', path: '/content' },
    { icon: <MessageCircle size={20} />, label: 'Chat', path: '/chat' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-64 h-full glass-panel flex flex-col p-4 m-2 rounded-2xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-full bg-jarvis-blue/20 flex items-center justify-center border border-jarvis-blue shadow-[0_0_10px_rgba(0,180,255,0.5)]">
          <div className="w-6 h-6 rounded-full border-2 border-jarvis-blue animate-pulse" />
        </div>
        <h1 className="text-xl font-bold jarvis-glow tracking-widest">AURA</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-jarvis-blue/20 text-jarvis-blue border border-jarvis-blue/50 jarvis-border-glow' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'}
            `}
          >
            {item.icon}
            <span className="font-medium tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">System Status</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-white/60">AURA Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
