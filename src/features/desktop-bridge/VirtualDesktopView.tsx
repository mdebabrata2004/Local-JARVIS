import React, { useState } from 'react';
import {
  Monitor,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Info,
} from 'lucide-react';
import { desktopBridge, SAFE_ALLOWLISTED_APPS } from '@/services/desktop-bridge/desktopBridgeService';
import { DesktopCapability } from '@/types';
import { soundService } from '@/services/sound/soundService';

export const VirtualDesktopView: React.FC = () => {
  const [capabilities, setCapabilities] = useState<DesktopCapability[]>(desktopBridge.getCapabilities());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const isConnected = desktopBridge.isNativeBridgeConnected();

  const handleLaunchApp = async (appId: string, _appName: string) => {
    soundService.playClick();
    const result = await desktopBridge.launchAllowlistedApp(appId);
    setFeedback(result.message);
    if (!result.success) {
      soundService.playWarning();
    }
  };

  const handleRequestPermission = async (capId: string) => {
    soundService.playClick();
    try {
      await desktopBridge.requestCapabilityPermission(capId);
      setCapabilities(desktopBridge.getCapabilities());
      setFeedback(`Permission updated for ${capId}`);
    } catch (err: any) {
      setFeedback(err.message);
      soundService.playWarning();
    }
  };

  const handleCaptureScreen = async () => {
    soundService.playClick();
    try {
      const blob = await desktopBridge.captureScreen();
      if (blob) {
        const url = URL.createObjectURL(blob);
        setScreenshotPreview(url);
        soundService.playActionConfirm();
        setFeedback('Workspace screenshot captured successfully.');
      }
    } catch (e: any) {
      setFeedback(`Screenshot failed: ${e.message}`);
    }
  };

  return (
    <div className="w-full h-full p-6 bg-slate-950 overflow-y-auto select-none space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            Virtual Desktop & Native Capability Registry
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Sandbox Isolation Model • Honest Capability Detection • Optional Tauri Desktop Bridge Interface
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs bg-slate-900 border-cyan-500/30">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>
            NATIVE BRIDGE:{' '}
            <strong className={isConnected ? 'text-emerald-300' : 'text-amber-300'}>
              {isConnected ? 'TAURI CONNECTED' : 'BROWSER SANDBOX ACTIVE'}
            </strong>
          </span>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-4 bg-slate-900/60 border border-cyan-500/30 rounded-xl space-y-2 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold uppercase font-mono tracking-wider">
          <Info className="w-4 h-4 text-cyan-400" />
          Browser Sandbox Isolation Boundary
        </div>
        <p className="text-slate-300">
          Standard browser security prevents web pages from executing arbitrary OS binaries, reading unrestricted filesystem directories, or intercepting system-wide keyboard hooks. To ensure uncompromising privacy and security, LOCAL JARVIS runs strictly inside your local browser by default.
        </p>
        <p className="text-slate-400 font-mono text-[11px]">
          An optional Windows desktop bridge can be built using Tauri and Rust (`src-tauri/`), communicating over a vetted IPC channel with explicit allowlists.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-cyan-950/70 border border-cyan-400/50 rounded-lg text-xs font-mono text-cyan-300 animate-fadeIn">
          {feedback}
        </div>
      )}

      {/* Capabilities Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Capability Registry Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-slate-100">{cap.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                      cap.status === 'available'
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}
                  >
                    {cap.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-normal">{cap.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-cyan-500/10 text-xs font-mono">
                <span className="text-slate-500">
                  {cap.requiresNativeBridge ? 'Requires Tauri Bridge' : 'Browser Standard API'}
                </span>
                {cap.status === 'available' ? (
                  cap.id === 'SCREENSHOT' ? (
                    <button
                      onClick={handleCaptureScreen}
                      className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 rounded text-[11px]"
                    >
                      Capture Now
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRequestPermission(cap.id)}
                      className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 rounded text-[11px]"
                    >
                      Check Permission
                    </button>
                  )
                ) : (
                  <span className="text-amber-400/80 text-[11px]">Sandboxed in Web Mode</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot Preview Modal / Area */}
      {screenshotPreview && (
        <div className="p-4 bg-slate-900/60 border border-cyan-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
            <span>Captured Workspace Screenshot</span>
            <button
              onClick={() => setScreenshotPreview(null)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <img src={screenshotPreview} alt="Screenshot" className="rounded max-h-64 object-contain border border-cyan-500/20" />
        </div>
      )}

      {/* Allowlisted Application Launcher Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Strict Allowlisted Application Targets
        </h3>
        <p className="text-xs text-slate-400">
          Only pre-verified, non-destructive utilities are allowlisted. No arbitrary command lines or external scripts can be invoked via hand gestures.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAFE_ALLOWLISTED_APPS.map((app) => (
            <div
              key={app.id}
              className="p-3 bg-slate-900/40 border border-cyan-500/20 rounded-xl flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-cyan-400/70 uppercase">{app.category}</span>
                <h4 className="font-semibold text-sm text-slate-100 mt-0.5">{app.name}</h4>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-1">{app.path}</div>
              </div>
              <button
                onClick={() => handleLaunchApp(app.id, app.name)}
                className="mt-3 w-full py-1.5 bg-cyan-950/60 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs font-mono text-cyan-300 transition flex items-center justify-center gap-1.5"
              >
                <span>Launch</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
