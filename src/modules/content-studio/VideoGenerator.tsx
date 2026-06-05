import { useState } from 'react';
import { Play, Download, CheckCircle2, Film, Music, Sparkles } from 'lucide-react';

const tracks = [
  { id: 'ambient', name: 'Ambient Tech' },
  { id: 'cyberpunk', name: 'Cyberpunk Night' },
  { id: 'lofi', name: 'Lo-fi Chill' },
  { id: 'energetic', name: 'High Energy' },
  { id: 'cinematic', name: 'Cinematic' },
];

const VideoGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('ambient');
  const [voiceover, setVoiceover] = useState('echo');

  const startGeneration = () => {
    setIsGenerating(true);
    setCompleted(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setCompleted(true);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const downloadPlaceholder = () => {
    const element = document.createElement('a');
    const content = `AURA AI Generated Video\nTrack: ${selectedTrack}\nVoice: ${voiceover}\nDuration: 30s\nResolution: 1080x1920\nStatus: Render Complete`;
    const blob = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = `aura-video-${Date.now()}.txt`;
    element.click();
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 glass-panel rounded-2xl p-6 border-jarvis-blue/20">
          <div className="aspect-video bg-black/40 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
            {completed ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-jarvis-blue/10 to-black/60">
                <CheckCircle2 className="w-16 h-16 text-jarvis-blue" />
                <p className="text-sm font-bold jarvis-glow">GENERATION COMPLETE</p>
                <div className="flex space-x-3">
                  <button onClick={() => { setCompleted(false); setProgress(0); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all">REPLAY</button>
                  <button onClick={downloadPlaceholder} className="px-4 py-2 bg-jarvis-blue text-black rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <Download className="w-3 h-3" /> DOWNLOAD
                  </button>
                </div>
                <div className="mt-2 px-3 py-1 bg-white/5 rounded-full text-[8px] text-white/40 font-mono">
                  Track: {tracks.find(t => t.id === selectedTrack)?.name} | Voice: {voiceover}
                </div>
              </div>
            ) : isGenerating ? (
              <div className="w-full px-20 space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-jarvis-blue">
                  <span>RENDER_IN_PROGRESS</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-jarvis-blue shadow-[0_0_10px_rgba(0,180,255,1)] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-[10px] text-white/40 animate-pulse">UPDATING NEURAL SYNAPSE WEIGHTS...</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mx-auto group-hover:border-jarvis-blue/50 transition-all">
                  <Film className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-xs text-white/40 italic">Click generate to render your video</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">Settings</h3>

            <div className="space-y-3">
              <label className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1">
                <Music className="w-3 h-3" /> Background Music
              </label>
              <div className="grid grid-cols-1 gap-1">
                {tracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                      selectedTrack === track.id
                        ? 'bg-jarvis-blue/20 border border-jarvis-blue/50 text-jarvis-blue'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span>{track.name}</span>
                    {selectedTrack === track.id && <span className="text-jarvis-blue text-[10px]">▶</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-bold">Voiceover</label>
              <select value={voiceover} onChange={(e) => setVoiceover(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none">
                <option value="echo">Echo (Deep)</option>
                <option value="nova">Nova (Clear)</option>
                <option value="onyx">Onyx (Robotic)</option>
              </select>
            </div>

            <button
              onClick={startGeneration}
              disabled={isGenerating}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
                isGenerating
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-jarvis-blue text-black hover:bg-jarvis-blue/80'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isGenerating ? 'GENERATING...' : 'GENERATE VIDEO'}</span>
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-4 border-jarvis-blue/10">
            <div className="flex items-center space-x-2 text-jarvis-blue mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">AI Tip</span>
            </div>
            <p className="text-[10px] text-white/60 leading-relaxed italic">
              "Using a deep male voiceover increases engagement for tech-themed shorts by 24%."
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Recent Generations</h3>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[180px] aspect-video bg-gradient-to-br from-jarvis-blue/5 to-black/40 rounded-lg border border-white/5 relative overflow-hidden group">
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-mono text-white/60">
                VIDEO_00{i}.MP4
              </div>
              <div className="absolute bottom-2 right-2">
                <Download className="w-3 h-3 text-white/30 hover:text-jarvis-blue cursor-pointer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;