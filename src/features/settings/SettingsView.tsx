import React, { useState, useEffect } from 'react';
import {
  Settings,
  Camera,
  Sliders,
  Volume2,
  Eye,
  ShieldCheck,
  Save,
  RotateCcw,
} from 'lucide-react';
import { AppSettings } from '@/types';
import { storageService, DEFAULT_SETTINGS } from '@/storage/db';
import { soundService } from '@/services/sound/soundService';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    soundService.playActionConfirm();
    await storageService.saveSettings(localSettings);
    onUpdateSettings(localSettings);
    soundService.setEnabled(localSettings.hudAudioFeedback);
    soundService.setSpeechEnabled(localSettings.hudSpeechSynthesis);
    setFeedback('Settings successfully saved to local persistent storage.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReset = async () => {
    soundService.playClick();
    setLocalSettings(DEFAULT_SETTINGS);
    await storageService.saveSettings(DEFAULT_SETTINGS);
    onUpdateSettings(DEFAULT_SETTINGS);
    setFeedback('Reset all configuration options to factory defaults.');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="w-full h-full p-6 bg-slate-950 overflow-y-auto select-none space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            System Settings & Privacy Preferences
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Local Configuration Profile • Zero Cloud Sync • Persisted in IndexedDB & localStorage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-mono transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs font-mono shadow-hud-glow transition"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-400/50 rounded-lg text-xs font-mono text-cyan-300">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Vision & Tracking */}
        <div className="p-5 bg-slate-900/40 border border-cyan-500/20 rounded-2xl space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            Vision & Hand Landmarker
          </h3>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Target Camera Resolution</label>
            <select
              value={localSettings.cameraResolution}
              onChange={(e) => handleChange('cameraResolution', e.target.value as any)}
              className="w-full bg-slate-950 border border-cyan-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
            >
              <option value="640x480">640 x 480 (Fastest Framerate)</option>
              <option value="1280x720">1280 x 720 (Balanced 720p)</option>
              <option value="1920x1080">1920 x 1080 (High Detail 1080p)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Mirror Camera Video Horizontally</span>
            <input
              type="checkbox"
              checked={localSettings.mirrorVideo}
              onChange={(e) => handleChange('mirrorVideo', e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Min Detection Confidence</span>
              <span className="text-cyan-300">{Math.round(localSettings.minDetectionConfidence * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.9"
              step="0.05"
              value={localSettings.minDetectionConfidence}
              onChange={(e) => handleChange('minDetectionConfidence', parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>

        {/* Section 2: Virtual Cursor & Interaction */}
        <div className="p-5 bg-slate-900/40 border border-cyan-500/20 rounded-2xl space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Virtual Cursor & Selection
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Enable Air Virtual Cursor Reticle</span>
            <input
              type="checkbox"
              checked={localSettings.virtualCursorEnabled}
              onChange={(e) => handleChange('virtualCursorEnabled', e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 block">Dwell Selection (Hover to Click)</span>
              <span className="text-[10px] text-slate-500">Accessibility mode: click without pinch</span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.dwellClickEnabled}
              onChange={(e) => handleChange('dwellClickEnabled', e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Cursor Speed & Acceleration</span>
              <span className="text-cyan-300">{localSettings.cursorSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.2"
              value={localSettings.cursorSpeed}
              onChange={(e) => handleChange('cursorSpeed', parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Dwell Click Duration</span>
              <span className="text-cyan-300">{localSettings.dwellTimeMs} ms</span>
            </div>
            <input
              type="range"
              min="500"
              max="2000"
              step="100"
              value={localSettings.dwellTimeMs}
              onChange={(e) => handleChange('dwellTimeMs', parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>

        {/* Section 3: Audio & Voice Feedback */}
        <div className="p-5 bg-slate-900/40 border border-cyan-500/20 rounded-2xl space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Audio Synthesis & Feedback
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 block">HUD Procedural Sound FX</span>
              <span className="text-[10px] text-slate-500">Synthesized clicks, beeps, chimes</span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.hudAudioFeedback}
              onChange={(e) => handleChange('hudAudioFeedback', e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 block">Speech Synthesis Voice Feedback</span>
              <span className="text-[10px] text-slate-500">Browser SpeechSynthesis (100% on-device TTS)</span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.hudSpeechSynthesis}
              onChange={(e) => handleChange('hudSpeechSynthesis', e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </div>
        </div>

        {/* Section 4: Visuals & Privacy Guarantee */}
        <div className="p-5 bg-slate-900/40 border border-cyan-500/20 rounded-2xl space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            Visual Design & Privacy
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Retro CRT Scanlines Overlay</span>
            <input
              type="checkbox"
              checked={localSettings.scanlinesEnabled}
              onChange={(e) => handleChange('scanlinesEnabled', e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Technical Grid Backdrop</span>
            <input
              type="checkbox"
              checked={localSettings.gridBackdropEnabled}
              onChange={(e) => handleChange('gridBackdropEnabled', e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </div>

          <div className="pt-2 border-t border-cyan-500/10 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
              <strong className="text-emerald-300">Privacy Verification:</strong> No video frames, audio recordings, or project files are ever transmitted to any remote server or third-party service.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
