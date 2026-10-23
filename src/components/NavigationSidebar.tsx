import React from 'react';
import {
  Activity,
  Camera,
  Sparkles,
  Layers,
  Monitor,
  Music,
  CheckSquare,
  FolderOpen,
  Sliders,
  Settings,
  ShieldAlert,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { NavigationModule } from '@/types';
import { soundService } from '@/services/sound/soundService';

interface NavigationSidebarProps {
  currentModule: NavigationModule;
  onNavigate: (module: NavigationModule) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMirrorMode: () => void;
}

const NAV_ITEMS: { id: NavigationModule; label: string; icon: any }[] = [
  { id: 'COMMAND_CENTER', label: 'Command Center', icon: Activity },
  { id: 'CAMERA_TRACKING', label: 'Camera & Vision', icon: Camera },
  { id: 'AIR_DRAWING', label: 'Air Drawing Studio', icon: Sparkles },
  { id: 'WORKSPACE_3D', label: '3D Workspace', icon: Layers },
  { id: 'VIRTUAL_DESKTOP', label: 'Virtual Desktop', icon: Monitor },
  { id: 'MEDIA_CENTER', label: 'Media Center', icon: Music },
  { id: 'PRODUCTIVITY', label: 'Productivity', icon: CheckSquare },
  { id: 'LOCAL_FILES', label: 'Local Files', icon: FolderOpen },
  { id: 'GESTURE_MAPPING', label: 'Gesture Mapping', icon: Sliders },
  { id: 'SETTINGS', label: 'Settings', icon: Settings },
  { id: 'DIAGNOSTICS', label: 'Diagnostics', icon: ShieldAlert },
  { id: 'ABOUT_HELP', label: 'About & Help', icon: HelpCircle },
];

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentModule,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onOpenMirrorMode,
}) => {
  return (
    <aside
      className={`h-full bg-slate-950/90 border-r border-cyan-500/20 backdrop-blur-md flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Brand Header */}
      <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center flex-shrink-0 shadow-hud-glow">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="truncate">
              <div className="font-mono font-black text-xs tracking-wider text-white uppercase">
                LOCAL JARVIS
              </div>
              <div className="text-[9px] font-mono text-cyan-400 truncate">V1.0 • PRIVACY FIRST</div>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-cyan-500/20 text-cyan-400 rounded transition mx-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundService.playClick();
                onNavigate(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs transition border ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-hud-glow font-semibold'
                  : 'border-transparent text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Mirror Mode & Footer Shortcut */}
      <div className="p-2 border-t border-cyan-500/20 space-y-2">
        <button
          onClick={() => {
            soundService.playActionConfirm();
            onOpenMirrorMode();
          }}
          className={`w-full flex items-center justify-center gap-2 py-2 bg-cyan-950/80 hover:bg-cyan-500/20 border border-cyan-400/50 rounded-xl text-cyan-300 text-xs font-mono transition ${
            collapsed ? 'px-2' : 'px-3'
          }`}
          title="Switch to Fullscreen Mirrored HUD"
        >
          <Maximize2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          {!collapsed && <span>Mirror HUD Mode</span>}
        </button>
      </div>
    </aside>
  );
};
