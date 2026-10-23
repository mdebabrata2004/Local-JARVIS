import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  Sliders,
  ShieldCheck,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { cameraService } from '@/services/camera/cameraService';
import { handLandmarkerService } from '@/services/hand-tracking/handLandmarkerService';
import { HandLandmarkData, RecognizedGesture, LANDMARK_INDEX as IDX } from '@/types';
import { soundService } from '@/services/sound/soundService';

interface CameraTrackingViewProps {
  isCameraActive: boolean;
  onToggleCamera: () => void;
  gesture: RecognizedGesture | null;
  hands: HandLandmarkData[];
  smoothing: number;
  onSmoothingChange: (val: number) => void;
  confidence: number;
  onConfidenceChange: (val: number) => void;
  videoElement: HTMLVideoElement | null;
}

// Landmark Bone connections for rendering hand skeleton
const HAND_CONNECTIONS = [
  // Thumb
  [IDX.WRIST, IDX.THUMB_CMC],
  [IDX.THUMB_CMC, IDX.THUMB_MCP],
  [IDX.THUMB_MCP, IDX.THUMB_IP],
  [IDX.THUMB_IP, IDX.THUMB_TIP],
  // Index
  [IDX.WRIST, IDX.INDEX_MCP],
  [IDX.INDEX_MCP, IDX.INDEX_PIP],
  [IDX.INDEX_PIP, IDX.INDEX_DIP],
  [IDX.INDEX_DIP, IDX.INDEX_TIP],
  // Middle
  [IDX.INDEX_MCP, IDX.MIDDLE_MCP],
  [IDX.MIDDLE_MCP, IDX.MIDDLE_PIP],
  [IDX.MIDDLE_PIP, IDX.MIDDLE_DIP],
  [IDX.MIDDLE_DIP, IDX.MIDDLE_TIP],
  // Ring
  [IDX.MIDDLE_MCP, IDX.RING_MCP],
  [IDX.RING_MCP, IDX.RING_PIP],
  [IDX.RING_PIP, IDX.RING_DIP],
  [IDX.RING_DIP, IDX.RING_TIP],
  // Pinky
  [IDX.RING_MCP, IDX.PINKY_MCP],
  [IDX.PINKY_MCP, IDX.PINKY_PIP],
  [IDX.PINKY_PIP, IDX.PINKY_DIP],
  [IDX.PINKY_DIP, IDX.PINKY_TIP],
  [IDX.WRIST, IDX.PINKY_MCP],
];

export const CameraTrackingView: React.FC<CameraTrackingViewProps> = ({
  isCameraActive,
  onToggleCamera,
  gesture,
  hands,
  smoothing,
  onSmoothingChange,
  confidence,
  onConfidenceChange,
  videoElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');
  const [resolution, setResolution] = useState<'640x480' | '1280x720' | '1920x1080'>('1280x720');
  const [calibrationActive, setCalibrationActive] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [errorMsg] = useState<string | null>(null);

  // Load camera devices
  useEffect(() => {
    cameraService.getAvailableCameras().then(setDevices);
  }, [isCameraActive]);

  // Render 21-Landmark skeleton onto canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (hands.length === 0) return;

    const w = canvas.width;
    const h = canvas.height;

    hands.forEach((hand) => {
      const lm = hand.landmarks;
      if (!lm || lm.length < 21) return;

      // Draw bones
      ctx.strokeStyle = hand.handedness === 'Right' ? '#00f3ff' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f3ff';

      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = lm[startIdx];
        const end = lm[endIdx];
        ctx.beginPath();
        ctx.moveTo(start.x * w, start.y * h);
        ctx.lineTo(end.x * w, end.y * h);
        ctx.stroke();
      });

      // Draw landmark nodes
      lm.forEach((pt, index) => {
        const isTip =
          index === IDX.THUMB_TIP ||
          index === IDX.INDEX_TIP ||
          index === IDX.MIDDLE_TIP ||
          index === IDX.RING_TIP ||
          index === IDX.PINKY_TIP;

        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, isTip ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? '#ffffff' : '#00f3ff';
        ctx.fill();
        ctx.strokeStyle = isTip ? '#00f3ff' : '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Index Fingertip Targeting Reticle
        if (index === IDX.INDEX_TIP) {
          ctx.beginPath();
          ctx.arc(pt.x * w, pt.y * h, 12, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    });
  }, [hands]);

  const toggleSimulation = () => {
    const next = !simulating;
    setSimulating(next);
    handLandmarkerService.setSimulation(next, 0.5, 0.45, next ? 'DRAWING_POSE' : 'NONE');
    soundService.playClick();
  };

  return (
    <div className="w-full h-full flex flex-col p-6 bg-slate-950 overflow-y-auto select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            Camera & Computer Vision Tracking
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Local on-device MediaPipe Hand Landmarker (VIDEO Mode) • Zero frame streaming to remote servers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition ${
              simulating
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {simulating ? 'Simulated Hand: Active' : 'Simulate Hand (No Cam)'}
          </button>

          <button
            onClick={onToggleCamera}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold tracking-wider transition ${
              isCameraActive
                ? 'bg-rose-500/20 border border-rose-500 text-rose-300 hover:bg-rose-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-hud-glow'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                DISABLE CAMERA
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                ENABLE CAMERA
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 rounded-lg flex items-center gap-3 text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Video & Skeleton Viewport */}
        <div className="lg:col-span-2 flex flex-col bg-slate-900/40 border border-cyan-500/20 rounded-xl overflow-hidden relative">
          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px]">
            {isCameraActive && videoElement ? (
              <>
                {/* Mirrored Video Preview */}
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
                  className="w-full h-full object-contain -scale-x-100"
                />
                {/* Hand Skeleton Overlay */}
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-500 p-8 text-center">
                <CameraOff className="w-12 h-12 text-slate-600" />
                <p className="text-sm font-mono">Webcam feed is inactive</p>
                <p className="text-xs text-slate-600 max-w-sm">
                  Click 'Enable Camera' to activate local MediaPipe tracking, or enable 'Simulate Hand' to test gesture features without physical hardware.
                </p>
              </div>
            )}

            {/* Calibration Boundary Frame */}
            {calibrationActive && (
              <div className="absolute inset-16 border-2 border-dashed border-cyan-400/60 rounded pointer-events-none flex items-center justify-center">
                <span className="bg-slate-950/80 px-2 py-1 font-mono text-[10px] text-cyan-300">
                  Active Interaction Boundary
                </span>
              </div>
            )}

            {/* Corner Tech Accents */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
          </div>

          {/* Stream Diagnostics Footer */}
          <div className="p-3 bg-slate-950/80 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-4">
              <span>HANDS DETECTED: {hands.length}</span>
              <span>
                ACTIVE GESTURE:{' '}
                <strong className="text-white">{gesture?.type || 'NONE'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ON-DEVICE ONLY</span>
            </div>
          </div>
        </div>

        {/* Tracking Parameters & Controls */}
        <div className="space-y-4">
          {/* Hardware Configuration */}
          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4 space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-wider text-cyan-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Capture Device Settings
            </h3>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1.5">Select Video Input</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400 font-mono"
              >
                <option value="default">Default System Camera</option>
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1.5">Camera Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full bg-slate-950 border border-cyan-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400 font-mono"
              >
                <option value="640x480">640 x 480 (High Performance)</option>
                <option value="1280x720">1280 x 720 (Balanced HD)</option>
                <option value="1920x1080">1920 x 1080 (High Detail Full HD)</option>
              </select>
            </div>
          </div>

          {/* Vision Thresholds */}
          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4 space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-wider text-cyan-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Tracking Filtering & Smoothing
            </h3>

            {/* Smoothing EMA Alpha */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Smoothing Factor (EMA)</span>
                <span className="text-cyan-300">{Math.round(smoothing * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={smoothing}
                onChange={(e) => onSmoothingChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <p className="text-[10px] text-slate-500">
                Higher smoothing removes jitter; lower smoothing provides instant response.
              </p>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Detection Confidence</span>
                <span className="text-cyan-300">{Math.round(confidence * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.9"
                step="0.05"
                value={confidence}
                onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Calibration Wizard Button */}
            <div className="pt-2 border-t border-cyan-500/10">
              <button
                onClick={() => setCalibrationActive(!calibrationActive)}
                className={`w-full py-2 rounded border font-mono text-xs transition ${
                  calibrationActive
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                }`}
              >
                {calibrationActive ? 'Close Calibration Overlay' : 'Open Calibration Wizard'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
