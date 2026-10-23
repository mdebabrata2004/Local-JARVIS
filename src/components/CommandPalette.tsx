import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Layers,
  Camera,
  Settings,
  HelpCircle,
  FolderOpen,
  Sliders,
  CheckSquare,
  Music,
  Power,
  RotateCcw,
} from 'lucide-react';
import { NavigationModule } from '@/types';
import { actionRegistry } from '@/services/actions/actionRegistry';
import { soundService } from '@/services/sound/soundService';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: NavigationModule) => void;
  onToggleCamera: () => void;
}

interface CommandItem {
  id: string;
  name: string;
  category: string;
  icon: any;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleCamera,
}) => {
  const [query, setQuery] = useState<string>('');

  const commands: CommandItem[] = [
    {
      id: 'cmd-drawing',
      name: 'Open Air Drawing Studio',
      category: 'Navigation',
      icon: Sparkles,
      action: () => {
        onNavigate('AIR_DRAWING');
        soundService.speak('Opening air drawing studio');
      },
    },
    {
      id: 'cmd-3d',
      name: 'Open 3D Holographic Workspace',
      category: 'Navigation',
      icon: Layers,
      action: () => {
        onNavigate('WORKSPACE_3D');
        soundService.speak('Entering 3D workspace');
      },
    },
    {
      id: 'cmd-camera',
      name: 'Toggle Camera Stream',
      category: 'System',
      icon: Camera,
      action: () => {
        onToggleCamera();
        soundService.speak('Toggling video stream');
      },
    },
    {
      id: 'cmd-media',
      name: 'Open Media Center',
      category: 'Navigation',
      icon: Music,
      action: () => {
        onNavigate('MEDIA_CENTER');
        soundService.speak('Opening media center');
      },
    },
    {
      id: 'cmd-prod',
      name: 'Open Productivity & Checklists',
      category: 'Navigation',
      icon: CheckSquare,
      action: () => {
        onNavigate('PRODUCTIVITY');
        soundService.speak('Opening productivity suite');
      },
    },
    {
      id: 'cmd-files',
      name: 'Open Local Files & Projects',
      category: 'Navigation',
      icon: FolderOpen,
      action: () => {
        onNavigate('LOCAL_FILES');
        soundService.speak('Opening local storage manager');
      },
    },
    {
      id: 'cmd-gestures',
      name: 'Configure Gesture Mappings',
      category: 'Navigation',
      icon: Sliders,
      action: () => {
        onNavigate('GESTURE_MAPPING');
        soundService.speak('Opening gesture mappings');
      },
    },
    {
      id: 'cmd-settings',
      name: 'Open Settings & Privacy',
      category: 'Navigation',
      icon: Settings,
      action: () => {
        onNavigate('SETTINGS');
        soundService.speak('Opening settings');
      },
    },
    {
      id: 'cmd-help',
      name: 'Show About & Operating Manual',
      category: 'Help',
      icon: HelpCircle,
      action: () => {
        onNavigate('ABOUT_HELP');
        soundService.speak('Opening reference manual');
      },
    },
    {
      id: 'cmd-stop',
      name: 'Emergency Stop All Gesture Tracking',
      category: 'Safety',
      icon: Power,
      action: () => {
        actionRegistry.setTrackingPaused(true);
        soundService.playWarning();
        soundService.speak('Emergency stop engaged. Gesture actions suspended.');
      },
    },
    {
      id: 'cmd-resume',
      name: 'Resume Gesture Tracking',
      category: 'Safety',
      icon: RotateCcw,
      action: () => {
        actionRegistry.setTrackingPaused(false);
        soundService.playActionConfirm();
        soundService.speak('Gesture tracking resumed.');
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-24 bg-black/75 backdrop-blur-sm select-none animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-hud-glow overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/20 bg-slate-950/80">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            autoFocus
            type="text"
            placeholder="Type a safe command or search modules (e.g. 'drawing', 'stop')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-mono text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                onClick={() => {
                  soundService.playClick();
                  cmd.action();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/15 text-left transition group border border-transparent hover:border-cyan-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-cyan-500/20 group-hover:border-cyan-400 text-cyan-400 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-slate-200 group-hover:text-cyan-300">
                      {cmd.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">
                      {cmd.category}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400/50 group-hover:text-cyan-300">
                  EXECUTE &rarr;
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-6 text-xs font-mono text-slate-500">
              No matching command found.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950 border-t border-cyan-500/10 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Safe Local Command Router • Strictly Finite Allowlist</span>
          <span>Zero External Calls</span>
        </div>
      </div>
    </div>
  );
};
