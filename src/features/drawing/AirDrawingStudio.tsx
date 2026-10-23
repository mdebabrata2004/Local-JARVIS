import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Paintbrush,
  Sparkles,
  Eraser,
  Highlighter,
  Minus,
  Square,
  Circle as CircleIcon,
  Undo2,
  Redo2,
  Trash2,
  Download,
  FileCode,
  Save,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Split,
} from 'lucide-react';
import { DrawingEngine } from './drawingEngine';
import { DrawingTool, RecognizedGesture } from '@/types';
import { storageService } from '@/storage/db';
import { soundService } from '@/services/sound/soundService';

interface AirDrawingStudioProps {
  gesture: RecognizedGesture | null;
  videoElement: HTMLVideoElement | null;
  isCameraActive: boolean;
}

const PALETTE_PRESETS = [
  '#00f3ff', // Cyan
  '#38bdf8', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#ffffff', // White
  '#030712', // Black
];

export const AirDrawingStudio: React.FC<AirDrawingStudioProps> = ({
  gesture,
  videoElement,
  isCameraActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DrawingEngine | null>(null);

  const [activeTool, setActiveTool] = useState<DrawingTool>('glow');
  const [activeColor, setActiveColor] = useState<string>('#00f3ff');
  const [strokeWidth, setStrokeWidth] = useState<number>(6);
  const [opacity, setOpacity] = useState<number>(0.9);
  const [symmetry, setSymmetry] = useState<boolean>(false);
  const [showVideoBg, setShowVideoBg] = useState<boolean>(true);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [isDrawingAir, setIsDrawingAir] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Mouse fallback drawing state
  const isMouseDownRef = useRef<boolean>(false);
  const lastAirPoseRef = useRef<boolean>(false);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Initialize Canvas & Engine
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const engine = new DrawingEngine({
      canvas: canvasRef.current,
      width,
      height,
      onHistoryChange: (u, r) => {
        setCanUndo(u);
        setCanRedo(r);
      },
    });
    engineRef.current = engine;
    engine.setTool(activeTool);
    engine.setColor(activeColor);
    engine.setWidth(strokeWidth);
    engine.setOpacity(opacity);
    engine.setSymmetry(symmetry);

    const handleResize = () => {
      if (containerRef.current && engineRef.current) {
        engineRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update engine properties when state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTool(activeTool);
      engineRef.current.setColor(activeColor);
      engineRef.current.setWidth(strokeWidth);
      engineRef.current.setOpacity(opacity);
      engineRef.current.setSymmetry(symmetry);
    }
  }, [activeTool, activeColor, strokeWidth, opacity, symmetry]);

  // Air Gesture Drawing Loop
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const isPen = gesture?.type === 'DRAWING_POSE' || gesture?.type === 'INDEX_POINT';

    if (isPen && gesture) {
      if (!lastAirPoseRef.current) {
        // Start stroke on gesture start
        engine.startStroke(gesture.position.x, gesture.position.y, true);
        setIsDrawingAir(true);
      } else {
        // Continue stroke
        engine.addPoint(gesture.position.x, gesture.position.y, true);
      }
      lastAirPoseRef.current = true;
    } else {
      // End stroke when gesture lost or changed
      if (lastAirPoseRef.current) {
        engine.endStroke();
        setIsDrawingAir(false);
      }
      lastAirPoseRef.current = false;
    }
  }, [gesture]);

  // Mouse & Touch fallback listeners
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !engineRef.current) return;
    isMouseDownRef.current = true;
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    // Mouse is not mirrored
    engineRef.current.startStroke(normX, normY, false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current || !engineRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    engineRef.current.addPoint(normX, normY, false);
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current && engineRef.current) {
      engineRef.current.endStroke();
      isMouseDownRef.current = false;
    }
  };

  const handleUndo = useCallback(() => {
    if (engineRef.current?.undo()) {
      soundService.playClick();
      showStatus('Undo');
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (engineRef.current?.redo()) {
      soundService.playClick();
      showStatus('Redo');
    }
  }, []);

  const handleClear = () => {
    setConfirmClearOpen(false);
    engineRef.current?.clearAll();
    soundService.playActionConfirm();
    showStatus('Canvas cleared');
  };

  const handleSave = async () => {
    if (!engineRef.current) return;
    const project = engineRef.current.toProject('Air Drawing Session');
    await storageService.saveDrawingProject(project);
    soundService.playActionConfirm();
    showStatus('Drawing saved to local database');
  };

  const handleExportPNG = () => {
    if (!engineRef.current) return;
    const dataUrl = engineRef.current.exportPNG(false);
    const link = document.createElement('a');
    link.download = `jarvis-air-drawing-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showStatus('Exported PNG');
  };

  const handleExportSVG = () => {
    if (!engineRef.current) return;
    const svgStr = engineRef.current.exportSVG();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `jarvis-air-drawing-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showStatus('Exported SVG');
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col bg-slate-950 select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Mirrored Webcam Background */}
      {showVideoBg && isCameraActive && videoElement && (
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
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-35 filter brightness-75 contrast-125 pointer-events-none"
        />
      )}

      {/* Decorative Technical Grid */}
      <div className="absolute inset-0 tech-grid pointer-events-none opacity-40" />

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none"
      />

      {/* Top Floating Control Bar */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Tool Selector */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/80 border border-cyan-500/30 rounded-xl backdrop-blur-md pointer-events-auto">
          <button
            onClick={() => setActiveTool('glow')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'glow' ? 'bg-cyan-500 text-slate-950 shadow-hud-glow' : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Glow Neon Brush"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('brush')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'brush' ? 'bg-cyan-500 text-slate-950 shadow-hud-glow' : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Solid Brush"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'highlighter' ? 'bg-cyan-500 text-slate-950 shadow-hud-glow' : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'eraser' ? 'bg-rose-500 text-white shadow-hud-glow' : 'text-slate-400 hover:text-rose-300'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-cyan-500/20 mx-1" />

          {/* Shape Tools */}
          <button
            onClick={() => setActiveTool('line')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'line' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('rectangle')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'rectangle' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('circle')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'circle' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Circle"
          >
            <CircleIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Center Indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isDrawingAir && (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-400 rounded-full text-xs font-mono text-cyan-300 backdrop-blur-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              AIR DRAWING ACTIVE (Index Finger)
            </div>
          )}
          {statusMsg && (
            <div className="px-3 py-1 bg-slate-900/90 border border-cyan-500/30 rounded-full text-xs font-mono text-cyan-300 backdrop-blur-md">
              {statusMsg}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/80 border border-cyan-500/30 rounded-xl backdrop-blur-md pointer-events-auto">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition ${
              canUndo ? 'text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition ${
              canRedo ? 'text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-cyan-500/20 mx-1" />

          <button
            onClick={() => setSymmetry(!symmetry)}
            className={`p-2 rounded-lg transition ${
              symmetry ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vertical Symmetry Mirror"
          >
            <Split className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowVideoBg(!showVideoBg)}
            className={`p-2 rounded-lg transition ${
              showVideoBg ? 'text-cyan-400' : 'text-slate-500'
            }`}
            title="Toggle Camera Feed Background"
          >
            {showVideoBg ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setConfirmClearOpen(true)}
            className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-cyan-500/20 mx-1" />

          <button
            onClick={handleSave}
            className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition"
            title="Save Project (IndexedDB)"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportPNG}
            className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition"
            title="Export PNG"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportSVG}
            className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition"
            title="Export Vector SVG"
          >
            <FileCode className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-400 hover:text-cyan-300 rounded-lg transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Bottom Floating Color & Stroke Settings */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-4 py-2 bg-slate-950/85 border border-cyan-500/30 rounded-2xl backdrop-blur-md">
        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {PALETTE_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              className={`w-5 h-5 rounded-full border transition transform hover:scale-110 ${
                activeColor === color ? 'border-white scale-125 shadow-hud-glow' : 'border-cyan-500/30'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={activeColor}
            onChange={(e) => setActiveColor(e.target.value)}
            className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded-full ml-1"
            title="Custom Color"
          />
        </div>

        <div className="w-[1px] h-6 bg-cyan-500/20" />

        {/* Stroke Width Slider */}
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
          <span className="text-[10px] text-slate-400">WIDTH</span>
          <input
            type="range"
            min="2"
            max="40"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-24 accent-cyan-400"
          />
          <span className="w-6 text-right">{strokeWidth}px</span>
        </div>

        <div className="w-[1px] h-6 bg-cyan-500/20" />

        {/* Opacity Slider */}
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
          <span className="text-[10px] text-slate-400">OPACITY</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-20 accent-cyan-400"
          />
          <span className="w-8 text-right">{Math.round(opacity * 100)}%</span>
        </div>
      </footer>

      {/* Confirmation Modal for Clear Canvas */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 p-6 rounded-xl max-w-sm w-full space-y-4 shadow-hud-glow">
            <h3 className="text-base font-semibold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Clear Entire Canvas?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove all strokes from the active drawing. This action can be undone using Undo.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
