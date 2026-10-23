import React from 'react';
import {
  Camera,
  CameraOff,
  Search,
  Volume2,
  VolumeX,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { NavigationModule, RecognizedGesture } from '@/types';

interface TopStatusBarProps {
  currentModule: NavigationModule;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  gesture: RecognizedGesture | null;
  fps: number;
  onOpenCommandPalette: () => void;
  audioFeedback: boolean;
  onToggleAudioFeedback: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  currentModule,
  isCameraActive,
  onToggleCamera,
  gesture,
  fps,
  onOpenCommandPalette,
  audioFeedback,
  onToggleAudioFeedback,
}) => {
  return (
    <header className="h-12 bg-slate-950/90 border-b border-cyan-500/20 backdrop-blur-md px-4 flex items-center justify-between z-20 select-none">
      {/* Current Module Title */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
          {currentModule.replace('_', ' ')}
        </span>
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>ON-DEVICE CV</span>
        </div>
      </div>

      {/* Center Live Gesture Reticle Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-cyan-500/30 rounded-full font-mono text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              gesture && gesture.type !== 'NONE'
                ? 'bg-cyan-400 animate-ping'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-slate-400 text-[10px]">GESTURE:</span>
          <strong className="text-white text-xs">{gesture?.type || 'IDLE'}</strong>
        </div>

        {fps > 0 && (
          <div className="hidden md:flex items-center gap-1 font-mono text-[11px] text-cyan-400/80 px-2 py-0.5">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>{fps} FPS</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 hover:bg-cyan-500/10 border border-cyan-500/30 text-slate-300 rounded-lg text-xs font-mono transition"
          title="Search commands (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline text-[11px]">Command Palette</span>
          <kbd className="hidden lg:inline px-1 py-0.2 text-[9px] bg-slate-800 border border-slate-700 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={onToggleCamera}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition ${
            isCameraActive
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : 'bg-cyan-950 border-cyan-400 text-cyan-300 hover:bg-cyan-500/20'
          }`}
          title="Toggle Webcam Tracking (Alt+C)"
        >
          {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isCameraActive ? 'Cam On' : 'Enable Cam'}</span>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleAudioFeedback}
          className="p-1.5 hover:bg-cyan-500/15 text-slate-400 hover:text-cyan-300 rounded-lg transition"
          title={audioFeedback ? 'Mute HUD Sound Effects' : 'Enable HUD Sound Effects'}
        >
          {audioFeedback ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </div>
    </header>
  );
};
