import React, { useState, useEffect } from 'react';
import {
  Activity,
  Camera,
  Layers,
  Monitor,
  Music,
  CheckSquare,
  FolderOpen,
  Sliders,
  Shield,
  Cpu,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { NavigationModule, RecognizedGesture, DrawingProject, Scene3DProject } from '@/types';
import { storageService } from '@/storage/db';
import { soundService } from '@/services/sound/soundService';

interface CommandCenterProps {
  onNavigate: (module: NavigationModule) => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  gesture: RecognizedGesture | null;
  fps: number;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigate,
  isCameraActive,
  onToggleCamera: _onToggleCamera,
  gesture,
  fps,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');
  const [recentDrawings, setRecentDrawings] = useState<DrawingProject[]>([]);
  const [recentScenes, setRecentScenes] = useState<Scene3DProject[]>([]);
  const [systemInfo, setSystemInfo] = useState<{
    concurrency: number | string;
    memoryGB: number | string;
    online: boolean;
    screenWidth: number;
    screenHeight: number;
    batteryLevel: string;
  }>({
    concurrency: '...',
    memoryGB: '...',
    online: true,
    screenWidth: 1920,
    screenHeight: 1080,
    batteryLevel: 'Unavailable',
  });

  // Clock & Date Tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
      setDate(now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Browser System Telemetry
  useEffect(() => {
    const concurrency = navigator.hardwareConcurrency || 'Unavailable';
    const memoryGB = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unavailable';
    const online = navigator.onLine;

    setSystemInfo((prev) => ({
      ...prev,
      concurrency,
      memoryGB,
      online,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    }));

    if ('getBattery' in navigator) {
      (navigator as any).getBattery?.().then((battery: any) => {
        setSystemInfo((prev) => ({
          ...prev,
          batteryLevel: `${Math.round(battery.level * 100)}% ${battery.charging ? '(Charging)' : ''}`,
        }));
      }).catch(() => {});
    }
  }, []);

  // Load Recent Projects from IndexedDB
  useEffect(() => {
    storageService.getAllDrawingProjects().then((drawings) => {
      setRecentDrawings(drawings.slice(-3).reverse());
    });
    storageService.getAll3DProjects().then((scenes) => {
      setRecentScenes(scenes.slice(-3).reverse());
    });
  }, []);

  const handleModuleClick = (mod: NavigationModule) => {
    soundService.playClick();
    onNavigate(mod);
  };

  return (
    <div className="w-full h-full flex flex-col p-6 bg-slate-950 overflow-y-auto select-none space-y-6">
      {/* Top Banner & Status Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900/40 border border-cyan-500/20 rounded-2xl relative overflow-hidden">
        {/* Glowing background accent */}
        <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4">
          {/* Animated Circular Arc Reactor HUD Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-spin-slow" />
            <div className="absolute inset-1.5 rounded-full border border-dashed border-cyan-400/50 animate-reverse-spin" />
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center shadow-hud-glow">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-widest text-white uppercase">
                JARVIS <span className="text-cyan-400 font-mono text-sm font-normal">v1.0</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-400 text-cyan-300">
                LOCAL-FIRST WORKSPACE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Target: Windows 10/11 PC • On-Device Hand Landmark Computer Vision • AI Agent Disabled
            </p>
          </div>
        </div>

        {/* Date & Time Widget */}
        <div className="flex items-center gap-6 font-mono text-right">
          <div>
            <div className="text-2xl font-bold tracking-wider text-cyan-300">{time}</div>
            <div className="text-xs text-slate-400">{date} • {utcTime}</div>
          </div>
          <div className="h-10 w-[1px] bg-cyan-500/20 hidden md:block" />
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              100% PRIVATE
            </span>
            <span className="text-[10px] text-slate-500">Zero Cloud Telemetry</span>
          </div>
        </div>
      </div>

      {/* Real-time System Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Camera Status */}
        <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>WEBCAM</span>
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="font-mono text-xs font-semibold text-slate-200">
              {isCameraActive ? 'ACTIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Metric 2: Gesture Status */}
        <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>GESTURE</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-xs font-semibold text-cyan-300 truncate">
            {gesture?.type || 'IDLE'}
          </div>
        </div>

        {/* Metric 3: Frame Rate */}
        <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>VISION FPS</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-xs font-semibold text-slate-200">
            {fps > 0 ? `${fps} FPS` : 'STANDBY'}
          </div>
        </div>

        {/* Metric 4: Hardware Concurrency */}
        <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>CPU THREADS</span>
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-xs font-semibold text-slate-200">
            {systemInfo.concurrency} CORES
          </div>
        </div>

        {/* Metric 5: Device Memory */}
        <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>DEVICE RAM</span>
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-xs font-semibold text-slate-200">
            {systemInfo.memoryGB}
          </div>
        </div>

        {/* Metric 6: Display Mode */}
        <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>DISPLAY</span>
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono text-xs font-semibold text-slate-200 truncate">
            {systemInfo.screenWidth}x{systemInfo.screenHeight}
          </div>
        </div>
      </div>

      {/* Module Quick Launch Matrix */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Workspace Modules
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'CAMERA_TRACKING' as NavigationModule,
              name: 'Camera & Vision',
              desc: 'Hand skeleton & landmark controls',
              icon: Camera,
              color: 'text-cyan-400',
            },
            {
              id: 'AIR_DRAWING' as NavigationModule,
              name: 'Air Drawing Studio',
              desc: 'Draw in the air with index finger',
              icon: Sparkles,
              color: 'text-sky-400',
            },
            {
              id: 'WORKSPACE_3D' as NavigationModule,
              name: '3D Workspace',
              desc: 'Three.js primitives & gestures',
              icon: Layers,
              color: 'text-cyan-300',
            },
            {
              id: 'VIRTUAL_DESKTOP' as NavigationModule,
              name: 'Virtual Desktop',
              desc: 'OS capabilities & Tauri bridge',
              icon: Monitor,
              color: 'text-blue-400',
            },
            {
              id: 'MEDIA_CENTER' as NavigationModule,
              name: 'Media Center',
              desc: 'Local audio & gesture controls',
              icon: Music,
              color: 'text-emerald-400',
            },
            {
              id: 'PRODUCTIVITY' as NavigationModule,
              name: 'Productivity Suite',
              desc: 'Notes, checklists, & timers',
              icon: CheckSquare,
              color: 'text-amber-400',
            },
            {
              id: 'LOCAL_FILES' as NavigationModule,
              name: 'Local Files',
              desc: 'IndexedDB & File System API',
              icon: FolderOpen,
              color: 'text-indigo-400',
            },
            {
              id: 'GESTURE_MAPPING' as NavigationModule,
              name: 'Gesture Mapping',
              desc: 'Configure gesture action bindings',
              icon: Sliders,
              color: 'text-rose-400',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleModuleClick(item.id)}
                className="p-4 bg-slate-900/40 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400 rounded-xl text-left transition duration-200 group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition`} />
                  <span className="text-[10px] font-mono text-cyan-400/50 group-hover:text-cyan-300">OPEN &rarr;</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Local Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Air Drawings */}
        <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">Recent Air Drawings</span>
            <button
              onClick={() => onNavigate('AIR_DRAWING')}
              className="text-[11px] font-mono text-cyan-400 hover:underline"
            >
              New Drawing +
            </button>
          </div>
          <div className="space-y-2">
            {recentDrawings.length > 0 ? (
              recentDrawings.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onNavigate('AIR_DRAWING')}
                  className="flex items-center justify-between p-2 bg-slate-950/60 border border-cyan-500/10 hover:border-cyan-400 rounded cursor-pointer transition text-xs"
                >
                  <span className="font-mono text-slate-200 truncate">{d.title}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center font-mono">
                No recent drawings saved in local database.
              </div>
            )}
          </div>
        </div>

        {/* Recent 3D Scenes */}
        <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">Recent 3D Scenes</span>
            <button
              onClick={() => onNavigate('WORKSPACE_3D')}
              className="text-[11px] font-mono text-cyan-400 hover:underline"
            >
              Open 3D &rarr;
            </button>
          </div>
          <div className="space-y-2">
            {recentScenes.length > 0 ? (
              recentScenes.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onNavigate('WORKSPACE_3D')}
                  className="flex items-center justify-between p-2 bg-slate-950/60 border border-cyan-500/10 hover:border-cyan-400 rounded cursor-pointer transition text-xs"
                >
                  <span className="font-mono text-slate-200 truncate">{s.title}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {s.objects?.length || 0} objects
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center font-mono">
                No recent 3D scenes saved in local database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
