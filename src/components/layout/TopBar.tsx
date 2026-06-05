import { useState, useRef } from 'react';
import { Mic, Search, Bell, Loader2, Square } from 'lucide-react';

interface TopBarProps {
  onAuraResponse?: (text: string) => void;
  onCommandSubmit?: (text: string) => void;
}

const TopBar = ({ onAuraResponse, onCommandSubmit }: TopBarProps) => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToSTT(audioBlob);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToSTT = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.wav');

      const response = await fetch('http://localhost:8000/api/voice/stt', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text) {
        setCommand(data.text);
        // Optionally auto-submit the command
        handleManualCommand(data.text);
      }
    } catch (error) {
      console.error('STT failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCommand = async (text: string) => {
    if (!text.trim()) return;
    if (onCommandSubmit) onCommandSubmit(text);
    setIsProcessing(true);
    if (onAuraResponse) onAuraResponse('');
    try {
      const response = await fetch('http://localhost:8000/api/command/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      let reply = '';
      if (data.response) {
        reply = data.response;
      } else if (data.command) {
        reply = `[${data.module}] ${data.command}`;
      } else {
        reply = 'AURA processed your request.';
      }
      setCommand('');
      if (onAuraResponse) onAuraResponse(reply);
    } catch (error) {
      if (onAuraResponse) onAuraResponse('⚠️ Backend offline. Start: cd backend && uvicorn app.main:app --port 8000');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualCommand(command);
    }
  };

  return (
    <div className="h-16 glass-panel flex items-center justify-between px-6 m-2 rounded-2xl">
      <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10 w-96 focus-within:border-jarvis-blue/50 transition-all">
        {isProcessing ? (
          <Loader2 size={18} className="text-jarvis-blue animate-spin" />
        ) : (
          <Search size={18} className="text-white/40" />
        )}
        <input 
          type="text" 
          placeholder="Command AURA..." 
          className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 w-full"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
        />
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500/20 border border-red-500/50 text-red-500' 
              : 'bg-jarvis-blue/10 border border-jarvis-blue/30 text-jarvis-blue hover:bg-jarvis-blue/20'
          }`}
        >
          {isRecording ? (
            <>
              <Square size={18} className="fill-current animate-pulse" />
              <span className="text-xs font-bold tracking-tighter uppercase">STOP</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-jarvis-blue animate-ping" />
              <Mic size={18} />
              <span className="text-xs font-bold tracking-tighter uppercase">VOICE</span>
            </>
          )}
        </button>

        <button className="text-white/60 hover:text-white transition-colors relative">
          <Bell size={20} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-jarvis-blue rounded-full" />
        </button>

        <div className="flex items-center gap-3 border-l border-white/10 pl-6">
          <div className="text-right">
            <p className="text-xs font-bold">STARK</p>
            <p className="text-[10px] text-white/40">ADMIN</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-jarvis-blue to-jarvis-dark p-[1px]">
            <div className="w-full h-full rounded-lg bg-[#0a192f] flex items-center justify-center font-bold text-xs">
              TS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
