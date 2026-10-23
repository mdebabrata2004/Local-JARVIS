import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Camera,
  Activity,
  Layers,
  Sparkles,
  Music,
} from 'lucide-react';
import { HandLandmarkData, RecognizedGesture, NavigationModule, LANDMARK_INDEX as IDX } from '@/types';

interface MirrorModeViewProps {
  isCameraActive: boolean;
  onToggleCamera: () => void;
  videoElement: HTMLVideoElement | null;
  gesture: RecognizedGesture | null;
  hands: HandLandmarkData[];
  onNavigate: (module: NavigationModule) => void;
}

export const MirrorModeView: React.FC<MirrorModeViewProps> = ({
  isCameraActive,
  onToggleCamera,
  videoElement,
  gesture,
  hands,
  onNavigate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPanels, setShowPanels] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Skeleton overlay on mirrored stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showSkeleton || hands.length === 0) return;

    const w = canvas.width;
    const h = canvas.height;

    hands.forEach((hand) => {
      const lm = hand.landmarks;
      if (!lm || lm.length < 21) return;

      // Draw connection lines
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f3ff';

      // Draw index and thumb targeting rings
      const indexTip = lm[IDX.INDEX_TIP];
      ctx.beginPath();
      ctx.arc(indexTip.x * w, indexTip.y * h, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Draw all nodes
      lm.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00f3ff';
        ctx.fill();
      });
    });
  }, [hands, showSkeleton]);

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      {/* 1. Fullscreen Mirrored Webcam Stream */}
      {isCameraActive && videoElement ? (
        <video
          ref={(el) => {
            if (el && el.srcObject !== videoElement.srcObject) {
              el.srcObject = videoElement.srcObject;
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-500 gap-3">
          <Camera className="w-12 h-12 text-slate-600" />
          <span className="font-mono text-sm">Webcam is inactive. Click to enable mirror mode.</span>
          <button
            onClick={onToggleCamera}
            className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-hud-glow"
          >
            ENABLE CAMERA
          </button>
        </div>
      )}

      {/* 2. Skeleton Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100 z-10"
      />

      {/* 3. Subtle HUD Vignette & Grid */}
      <div className="absolute inset-0 pointer-events-none tech-grid opacity-20 z-10" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(3,7,18,0.8)] z-10" />

      {/* 4. Floating Holographic HUD Panels */}
      {showPanels && (
        <>
          {/* Top Header Widget */}
          <header className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 p-3 bg-slate-950/70 border border-cyan-500/40 rounded-2xl backdrop-blur-md pointer-events-auto shadow-hud-panel">
              <div className="w-8 h-8 rounded-full border border-cyan-400 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div>
                <div className="font-bold font-mono text-sm tracking-wider text-white">JARVIS MIRROR HUD</div>
                <div className="text-[10px] font-mono text-cyan-400">IMMERSIVE INTERACTIVE WORKSPACE</div>
              </div>
            </div>

            {/* Clock & Status */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="px-4 py-2 bg-slate-950/70 border border-cyan-500/40 rounded-2xl backdrop-blur-md font-mono text-cyan-300 text-sm font-bold shadow-hud-panel">
                {time}
              </div>
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`p-2.5 rounded-xl border backdrop-blur-md transition ${
                  showSkeleton
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950/70 border-slate-700 text-slate-500'
                }`}
                title="Toggle Skeleton Overlay"
              >
                {showSkeleton ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowPanels(false)}
                className="p-2.5 bg-slate-950/70 border border-cyan-500/40 rounded-xl text-cyan-300 backdrop-blur-md hover:bg-cyan-500/20 transition"
                title="Focus Mode (Hide Panels)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Left Quick Launch Floating Dock */}
          <div className="absolute left-6 top-28 z-20 flex flex-col gap-2 p-2 bg-slate-950/75 border border-cyan-500/40 rounded-2xl backdrop-blur-md shadow-hud-panel">
            <button
              onClick={() => onNavigate('AIR_DRAWING')}
              className="p-3 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition flex items-center gap-3 text-xs font-mono group"
              title="Air Drawing"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="hidden group-hover:block pr-2">Air Drawing</span>
            </button>
            <button
              onClick={() => onNavigate('WORKSPACE_3D')}
              className="p-3 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition flex items-center gap-3 text-xs font-mono group"
              title="3D Workspace"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="hidden group-hover:block pr-2">3D Workspace</span>
            </button>
            <button
              onClick={() => onNavigate('MEDIA_CENTER')}
              className="p-3 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition flex items-center gap-3 text-xs font-mono group"
              title="Media Center"
            >
              <Music className="w-4 h-4 text-cyan-400" />
              <span className="hidden group-hover:block pr-2">Media Center</span>
            </button>
          </div>

          {/* Bottom Live Gesture Floating Reticle */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-5 py-2.5 bg-slate-950/80 border border-cyan-500/40 rounded-2xl backdrop-blur-md shadow-hud-panel">
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>GESTURE:</span>
              <strong className="text-white text-sm tracking-wide">{gesture?.type || 'IDLE'}</strong>
            </div>
            {gesture && gesture.type !== 'NONE' && (
              <div className="text-[10px] font-mono text-slate-400 border-l border-cyan-500/30 pl-3">
                {Math.round(gesture.confidence * 100)}% CONFIDENCE • {gesture.handedness}
              </div>
            )}
          </div>
        </>
      )}

      {/* Focus Mode Restore Button */}
      {!showPanels && (
        <button
          onClick={() => setShowPanels(true)}
          className="absolute top-6 right-6 z-30 p-3 bg-slate-950/80 border border-cyan-400 text-cyan-300 rounded-xl backdrop-blur-md hover:bg-cyan-500/20 transition shadow-hud-glow"
          title="Restore Panels"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
