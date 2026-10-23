import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Activity,
  Zap,
} from 'lucide-react';
import {
  GestureType,
  ActionId,
  RecognizedGesture,
} from '@/types';
import { actionRegistry, ACTION_DEFINITIONS } from '@/services/actions/actionRegistry';
import { gestureEngine } from '@/services/gestures/gestureEngine';
import { soundService } from '@/services/sound/soundService';

interface GestureMappingViewProps {
  currentGesture: RecognizedGesture | null;
}

const GESTURE_DESCRIPTIONS: Record<GestureType, { label: string; desc: string }> = {
  NONE: { label: 'No Gesture', desc: 'Hand is in relaxed or unclassified pose.' },
  DRAWING_POSE: { label: 'Air Drawing Pen', desc: 'Index extended, thumb neutral, middle/ring/pinky curled.' },
  INDEX_POINT: { label: 'Index Point', desc: 'Index finger pointing forward, all other fingers curled.' },
  OPEN_PALM: { label: 'Open Palm', desc: 'All 5 fingers fully extended and spread.' },
  CLOSED_FIST: { label: 'Closed Fist', desc: 'All fingers curled tightly into palm.' },
  VICTORY: { label: 'Victory / Peace', desc: 'Index and middle fingers extended, others curled.' },
  THUMBS_UP: { label: 'Thumbs Up', desc: 'Thumb pointing upward, others curled into palm.' },
  PINCH: { label: 'Index Pinch', desc: 'Thumb tip contacting index fingertip (<50mm).' },
  PINCH_MIDDLE: { label: 'Middle Pinch', desc: 'Thumb tip contacting middle fingertip.' },
  TWO_HAND_FRAME: { label: 'Two-Hand Viewfinder', desc: 'Both hands held up framing interaction bounds.' },
  SWIPE_LEFT: { label: 'Swipe Left', desc: 'Rapid leftward hand velocity (>0.45 unit/s).' },
  SWIPE_RIGHT: { label: 'Swipe Right', desc: 'Rapid rightward hand velocity.' },
  SWIPE_UP: { label: 'Swipe Up', desc: 'Rapid upward hand velocity.' },
  SWIPE_DOWN: { label: 'Swipe Down', desc: 'Rapid downward hand velocity.' },
  DWELL: { label: 'Dwell Hover', desc: 'Holding hand steady within 15px radius.' },
};

export const GestureMappingView: React.FC<GestureMappingViewProps> = ({ currentGesture }) => {
  const [config, setConfig] = useState(gestureEngine.getConfig());
  const [mappings, setMappings] = useState<Record<GestureType, ActionId>>(() => {
    const map: any = {};
    (Object.keys(GESTURE_DESCRIPTIONS) as GestureType[]).forEach((g) => {
      const act = actionRegistry.getActionForGesture(g);
      if (act) map[g] = act;
    });
    return map;
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleGesture = (gesture: GestureType) => {
    soundService.playClick();
    const updated = {
      ...config.enabledGestures,
      [gesture]: !config.enabledGestures[gesture],
    };
    const newConfig = { ...config, enabledGestures: updated };
    gestureEngine.updateConfig(newConfig);
    setConfig(newConfig);
  };

  const handleActionChange = (gesture: GestureType, actionId: ActionId) => {
    soundService.playClick();
    actionRegistry.mapGestureToAction(gesture, actionId);
    setMappings((prev) => ({ ...prev, [gesture]: actionId }));
    showFeedback(`Mapped ${gesture} to ${actionId}`);
  };

  const handleCooldownChange = (val: number) => {
    const newConfig = { ...config, cooldownMs: val };
    gestureEngine.updateConfig(newConfig);
    setConfig(newConfig);
  };

  const handlePinchThresholdChange = (val: number) => {
    const newConfig = { ...config, pinchThreshold: val };
    gestureEngine.updateConfig(newConfig);
    setConfig(newConfig);
  };

  const handleResetDefaults = () => {
    soundService.playActionConfirm();
    actionRegistry.resetDefaultMappings();
    const map: any = {};
    (Object.keys(GESTURE_DESCRIPTIONS) as GestureType[]).forEach((g) => {
      const act = actionRegistry.getActionForGesture(g);
      if (act) map[g] = act;
    });
    setMappings(map);
    showFeedback('Reset all gesture action mappings to defaults.');
  };

  return (
    <div className="w-full h-full p-6 bg-slate-950 overflow-y-auto select-none space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Gesture Recognition & Action Mapping
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Geometric Classification Pipeline • Configurable Thresholds • Safe Action Dispatch Registry
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-400 rounded-lg text-xs font-mono transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          Reset Default Mappings
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-400/50 rounded-lg text-xs font-mono text-cyan-300">
          {feedback}
        </div>
      )}

      {/* Live Classifier Feedback Gauge */}
      <div className="p-4 bg-slate-900/60 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center shadow-hud-glow">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Live Recognized Gesture</span>
            <div className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <span>{currentGesture?.type || 'NONE'}</span>
              {currentGesture && currentGesture.type !== 'NONE' && (
                <span className="text-xs font-normal text-cyan-400">
                  ({Math.round(currentGesture.confidence * 100)}% conf)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">HANDEDNESS</span>
            <span className="text-cyan-300 font-bold">{currentGesture?.handedness || 'None'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">CONTINUOUS DURATION</span>
            <span className="text-cyan-300 font-bold">{currentGesture ? `${Math.round(currentGesture.duration)}ms` : '0ms'}</span>
          </div>
        </div>
      </div>

      {/* Global Engine Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300">Action Trigger Cooldown</span>
            <span className="text-cyan-300 font-bold">{config.cooldownMs} ms</span>
          </div>
          <input
            type="range"
            min="100"
            max="1200"
            step="50"
            value={config.cooldownMs}
            onChange={(e) => handleCooldownChange(parseInt(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <p className="text-[10px] text-slate-500 font-mono">
            Prevents repeating an action accidentally while holding a static gesture.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300">Pinch Contact Distance</span>
            <span className="text-cyan-300 font-bold">{(config.pinchThreshold * 1000).toFixed(0)} mm equiv</span>
          </div>
          <input
            type="range"
            min="0.03"
            max="0.09"
            step="0.005"
            value={config.pinchThreshold}
            onChange={(e) => handlePinchThresholdChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <p className="text-[10px] text-slate-500 font-mono">
            Adjusts how close thumb and index fingertips must approach to trigger a pinch select.
          </p>
        </div>
      </div>

      {/* Gesture Mapping Matrix Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Gesture to Action Binding Matrix
        </h3>

        <div className="space-y-2">
          {(Object.keys(GESTURE_DESCRIPTIONS) as GestureType[])
            .filter((g) => g !== 'NONE')
            .map((g) => {
              const info = GESTURE_DESCRIPTIONS[g];
              const isEnabled = config.enabledGestures[g] ?? true;
              const mappedAction = mappings[g] || 'NONE';

              return (
                <div
                  key={g}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                    currentGesture?.type === g
                      ? 'bg-cyan-950/50 border-cyan-400 shadow-hud-glow'
                      : 'bg-slate-900/40 border-cyan-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleGesture(g)}
                      className="accent-cyan-400 rounded w-4 h-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-100">{info.label}</span>
                        <span className="text-[10px] font-mono text-cyan-400/70">[{g}]</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{info.desc}</p>
                    </div>
                  </div>

                  {/* Action Selector */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">ACTION:</span>
                    <select
                      value={mappedAction}
                      onChange={(e) => handleActionChange(g, e.target.value as ActionId)}
                      disabled={!isEnabled}
                      className="bg-slate-950 border border-cyan-500/30 rounded px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-cyan-400 font-mono disabled:opacity-40 w-full sm:w-56"
                    >
                      <option value="NONE">None / Disabled</option>
                      {Object.values(ACTION_DEFINITIONS).map((def) => (
                        <option key={def.id} value={def.id}>
                          {def.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
