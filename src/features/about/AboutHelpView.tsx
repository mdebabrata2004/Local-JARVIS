import React from 'react';
import {
  HelpCircle,
  Keyboard,
  Hand,
  Shield,
  Info,
  CheckCircle,
} from 'lucide-react';

export const AboutHelpView: React.FC = () => {
  return (
    <div className="w-full h-full p-6 bg-slate-950 overflow-y-auto select-none space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            About & Gesture Operating Reference
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            LOCAL JARVIS Version 1.0 • Technical Documentation & Interaction Manual
          </p>
        </div>
      </div>

      {/* Optical Hologram vs Screen HUD Disclaimer */}
      <div className="p-5 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl space-y-2 text-xs leading-relaxed font-mono">
        <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider text-sm">
          <Info className="w-4 h-4 text-cyan-400" />
          Optical Hologram vs On-Screen HUD Graphics
        </div>
        <p className="text-slate-300">
          In movie fiction, JARVIS creates glowing volumetric light suspended in mid-air. In physical reality on a standard 2D Windows monitor or laptop screen, true free-space holograms without volumetric hardware or AR glasses cannot physically exist.
        </p>
        <p className="text-slate-400">
          LOCAL JARVIS achieves an immersive, futuristic experience through mirrored webcam passthrough, transparent WebGL planes, 3D spatial orbit viewports, and on-device MediaPipe 21-landmark hand computer vision.
        </p>
      </div>

      {/* Hand Gesture Operating Manual */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <Hand className="w-4 h-4 text-cyan-400" />
          Hand Gesture Quick Reference Guide
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-1.5">
            <div className="text-cyan-300 font-bold flex items-center justify-between">
              <span>AIR DRAWING PEN</span>
              <span className="text-[10px] text-slate-500">[DRAWING_POSE]</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Extend index finger while keeping middle, ring, and pinky curled into your palm. Moves the drawing cursor and paints lines.
            </p>
          </div>

          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-1.5">
            <div className="text-cyan-300 font-bold flex items-center justify-between">
              <span>PINCH SELECTION</span>
              <span className="text-[10px] text-slate-500">[PINCH]</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Bring the tip of your thumb and index finger together (&lt;50mm). Emits a virtual click on the hovered button or card.
            </p>
          </div>

          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-1.5">
            <div className="text-cyan-300 font-bold flex items-center justify-between">
              <span>OPEN PALM (ROTATE)</span>
              <span className="text-[10px] text-slate-500">[OPEN_PALM]</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Spread all five fingers wide. Rotates the active 3D primitive, pauses/plays media, or pans the camera.
            </p>
          </div>

          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-1.5">
            <div className="text-cyan-300 font-bold flex items-center justify-between">
              <span>SWIPE LEFT / RIGHT</span>
              <span className="text-[10px] text-slate-500">[SWIPE_L / SWIPE_R]</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Quick horizontal hand movement across the camera frame. Triggers Next/Previous track, or Undo/Redo.
            </p>
          </div>

          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-1.5">
            <div className="text-cyan-300 font-bold flex items-center justify-between">
              <span>CLOSED FIST (STOP)</span>
              <span className="text-[10px] text-slate-500">[CLOSED_FIST]</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Curl all fingers into a tight fist. Instantly halts active continuous actions and releases active drawing strokes.
            </p>
          </div>

          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-1.5">
            <div className="text-cyan-300 font-bold flex items-center justify-between">
              <span>TWO-HAND FRAMING</span>
              <span className="text-[10px] text-slate-500">[TWO_HAND_FRAME]</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Hold up both hands simultaneously. In the 3D workspace, dynamically scales the selected object based on hand distance.
            </p>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-cyan-400" />
          Desktop Keyboard Shortcuts
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-900/40 border border-cyan-500/20 rounded-xl flex items-center justify-between">
            <span className="text-slate-400">Command Palette</span>
            <kbd className="px-2 py-0.5 bg-slate-950 border border-cyan-500/40 rounded text-cyan-300 font-bold">
              Ctrl + K
            </kbd>
          </div>
          <div className="p-3 bg-slate-900/40 border border-cyan-500/20 rounded-xl flex items-center justify-between">
            <span className="text-slate-400">Undo Action</span>
            <kbd className="px-2 py-0.5 bg-slate-950 border border-cyan-500/40 rounded text-cyan-300 font-bold">
              Ctrl + Z
            </kbd>
          </div>
          <div className="p-3 bg-slate-900/40 border border-cyan-500/20 rounded-xl flex items-center justify-between">
            <span className="text-slate-400">Redo Action</span>
            <kbd className="px-2 py-0.5 bg-slate-950 border border-cyan-500/40 rounded text-cyan-300 font-bold">
              Ctrl + Y
            </kbd>
          </div>
          <div className="p-3 bg-slate-900/40 border border-cyan-500/20 rounded-xl flex items-center justify-between">
            <span className="text-slate-400">Toggle Camera</span>
            <kbd className="px-2 py-0.5 bg-slate-950 border border-cyan-500/40 rounded text-cyan-300 font-bold">
              Alt + C
            </kbd>
          </div>
        </div>
      </div>

      {/* Architectural Guarantee */}
      <div className="p-5 bg-slate-900/40 border border-cyan-500/20 rounded-2xl space-y-3 text-xs font-mono">
        <h3 className="text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Architectural Transparency & Privacy Contract
        </h3>
        <ul className="space-y-1.5 text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span><strong>No Generative AI or LLMs:</strong> The AI conversational assistant is strictly disabled for V1.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span><strong>Zero Remote Telemetry:</strong> All hand landmark inference runs inside WebAssembly via Google MediaPipe.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span><strong>Local Data Only:</strong> Drawing projects, 3D scenes, and notes remain inside your machine's IndexedDB.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
