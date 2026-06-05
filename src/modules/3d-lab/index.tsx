import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Layers, RotateCcw } from 'lucide-react';

// Pure CSS 3D cube — works in ANY browser, zero WebGL issues
const Css3DCube = ({ exploded }: { exploded: boolean }) => {
  const cubeRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animId: number;
    let start = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - start) / 1000;
      setRotation({
        x: elapsed * 20,
        y: elapsed * 30,
      });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const faceStyle = (face: string): React.CSSProperties => {
    const base: React.CSSProps = {
      position: 'absolute',
      width: 120,
      height: 120,
      border: '2px solid #00B4FF',
      background: 'rgba(0, 180, 255, 0.05)',
      boxShadow: '0 0 15px rgba(0, 180, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      color: '#00B4FF',
      fontFamily: 'monospace',
      textTransform: 'uppercase',
      letterSpacing: 2,
      borderRadius: 4,
    };
    switch(face) {
      case 'front': return { ...base, transform: 'translateZ(60px)' };
      case 'back': return { ...base, transform: 'rotateY(180deg) translateZ(60px)' };
      case 'right': return { ...base, transform: 'rotateY(90deg) translateZ(60px)' };
      case 'left': return { ...base, transform: 'rotateY(-90deg) translateZ(60px)' };
      case 'top': return { ...base, transform: 'rotateX(90deg) translateZ(60px)' };
      case 'bottom': return { ...base, transform: 'rotateX(-90deg) translateZ(60px)' };
      default: return base;
    }
  };

  const innerStyle: React.CSSProps = {
    position: 'absolute',
    width: 60,
    height: 60,
    border: '2px solid #0088FF',
    background: 'rgba(0, 136, 255, 0.1)',
    boxShadow: '0 0 20px rgba(0, 136, 255, 0.3)',
    transform: exploded ? 'translateZ(30px) translateX(60px) translateY(60px)' : 'translateZ(30px)',
    borderRadius: 4,
    transition: 'transform 0.5s ease',
  };

  return (
    <div style={{ perspective: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div
        ref={cubeRef}
        style={{
          width: 120,
          height: 120,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: 'transform 0.1s',
        }}
      >
        <div style={faceStyle('front')}>FRONT</div>
        <div style={faceStyle('back')}>BACK</div>
        <div style={faceStyle('right')}>RIGHT</div>
        <div style={faceStyle('left')}>LEFT</div>
        <div style={faceStyle('top')}>TOP</div>
        <div style={faceStyle('bottom')}>BOTTOM</div>
        <div style={innerStyle} />
      </div>
    </div>
  );
};

const Lab3D = () => {
  const [isExploded, setIsExploded] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950/20 rounded-3xl border border-jarvis-blue/10">
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <Css3DCube exploded={isExploded} />
      </div>

      <div className="absolute top-6 left-6 z-10 pointer-events-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-4 rounded-2xl border-l-4 border-l-jarvis-blue">
          <div className="text-[10px] text-jarvis-blue font-bold tracking-widest uppercase mb-1">Module // 3D_LAB</div>
          <h2 className="text-xl font-bold jarvis-glow">AURA_ENGINE_V1</h2>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between w-40 text-[10px]"><span className="text-white/40 uppercase">Polygons</span><span className="text-white">12,452</span></div>
            <div className="flex justify-between w-40 text-[10px]"><span className="text-white/40 uppercase">Render Mode</span><span className="text-jarvis-blue">HOLOGRAPHIC</span></div>
            <div className="flex justify-between w-40 text-[10px]"><span className="text-white/40 uppercase">Engine</span><span className="text-jarvis-blue">CSS 3D</span></div>
          </div>
        </motion.div>
      </div>

      <div className="absolute top-6 right-6 z-10 flex flex-col gap-4">
        <button onClick={() => setIsExploded(!isExploded)} className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all ${isExploded ? 'bg-jarvis-blue text-slate-950' : 'glass-panel text-white/70 hover:text-jarvis-blue'}`}>
          <Layers className="w-5 h-5" />
          <span className="absolute right-full mr-3 px-2 py-1 bg-slate-900 border border-jarvis-blue/30 rounded text-[10px] text-jarvis-blue whitespace-nowrap opacity-0 group-hover:opacity-100">{isExploded ? 'Assemble' : 'Explode'}</span>
        </button>
        <button onClick={() => setIsExploded(false)} className="group relative flex items-center justify-center w-12 h-12 rounded-xl glass-panel text-white/70 hover:text-jarvis-blue">
          <RotateCcw className="w-5 h-5" />
          <span className="absolute right-full mr-3 px-2 py-1 bg-slate-900 border border-jarvis-blue/30 rounded text-[10px] text-jarvis-blue whitespace-nowrap opacity-0 group-hover:opacity-100">Reset</span>
        </button>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-between items-center pointer-events-none">
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 border-jarvis-blue/20">
          <div className="w-2 h-2 rounded-full bg-jarvis-blue animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-white/60">SYSTEM_READY // NO_ERRORS_DETECTED</span>
        </div>
        <div className="glass-panel px-4 py-2 rounded-full text-[10px] font-mono text-white/60">FPS: 60</div>
      </div>
    </div>
  );
};

export default Lab3D;