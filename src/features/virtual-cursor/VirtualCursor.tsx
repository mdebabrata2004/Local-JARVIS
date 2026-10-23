import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RecognizedGesture } from '@/types';
import { soundService } from '@/services/sound/soundService';

interface VirtualCursorProps {
  enabled: boolean;
  gesture: RecognizedGesture | null;
  speed?: number; // 1 to 5
  dwellClickEnabled?: boolean;
  dwellTimeMs?: number;
  mirrorX?: boolean;
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({
  enabled,
  gesture,
  speed = 2.5,
  dwellClickEnabled = true,
  dwellTimeMs = 900,
  mirrorX = true,
}) => {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const posRef = useRef(pos);
  posRef.current = pos;

  const dwellStartRef = useRef<number | null>(null);
  const dwellTargetRef = useRef<{ x: number; y: number } | null>(null);
  const lastClickedElementRef = useRef<Element | null>(null);

  // Calibration boundary: maps camera normalized coordinates (e.g., 0.15 to 0.85) to full screen
  const CALIBRATION = { minX: 0.15, maxX: 0.85, minY: 0.15, maxY: 0.85 };

  const triggerSyntheticClick = useCallback((x: number, y: number) => {
    // Hide cursor temporarily from hit-testing
    const el = document.elementFromPoint(x, y);
    if (!el) return;

    soundService.playClick();
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 250);

    // Dispatch real mouse events so buttons, links, and inputs trigger naturally
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: x, clientY: y });
    const mouseup = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: x, clientY: y });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y });

    el.dispatchEvent(mousedown);
    el.dispatchEvent(mouseup);
    el.dispatchEvent(click);

    if (el instanceof HTMLElement) {
      el.focus();
    }
  }, []);

  useEffect(() => {
    if (!enabled || !gesture || gesture.type === 'NONE') {
      setDwellProgress(0);
      dwellStartRef.current = null;
      return;
    }

    // Map gesture normalized coordinates (0..1) with calibration
    const rawX = mirrorX ? 1.0 - gesture.position.x : gesture.position.x;
    const rawY = gesture.position.y;

    // Apply calibration clamping and expansion
    const clampedX = Math.max(CALIBRATION.minX, Math.min(CALIBRATION.maxX, rawX));
    const clampedY = Math.max(CALIBRATION.minY, Math.min(CALIBRATION.maxY, rawY));

    const normalizedMappedX = (clampedX - CALIBRATION.minX) / (CALIBRATION.maxX - CALIBRATION.minX);
    const normalizedMappedY = (clampedY - CALIBRATION.minY) / (CALIBRATION.maxY - CALIBRATION.minY);

    const screenTargetX = normalizedMappedX * window.innerWidth;
    const screenTargetY = normalizedMappedY * window.innerHeight;

    // Exponential smoothing
    const alpha = Math.min(0.45 * (speed / 2.5), 0.8);
    const newX = posRef.current.x + (screenTargetX - posRef.current.x) * alpha;
    const newY = posRef.current.y + (screenTargetY - posRef.current.y) * alpha;

    setPos({ x: newX, y: newY });

    // Hit-testing hovered element
    const el = document.elementFromPoint(newX, newY);
    if (el) {
      const tag = el.tagName.toLowerCase();
      const isInteractive =
        tag === 'button' ||
        tag === 'a' ||
        tag === 'input' ||
        el.getAttribute('role') === 'button' ||
        el.closest('button') !== null;
      setHoveredElement(isInteractive ? 'interactive' : null);
    } else {
      setHoveredElement(null);
    }

    // Pinch Click Trigger
    if (gesture.type === 'PINCH') {
      if (!isClicking && lastClickedElementRef.current !== el) {
        lastClickedElementRef.current = el;
        triggerSyntheticClick(newX, newY);
      }
    } else {
      lastClickedElementRef.current = null;
    }

    // Dwell Click Logic
    if (dwellClickEnabled && gesture.type !== 'PINCH') {
      const prevDwell = dwellTargetRef.current;
      const movedDist = prevDwell ? Math.hypot(newX - prevDwell.x, newY - prevDwell.y) : 999;

      if (movedDist < 18) {
        // Lingering in same spot
        if (!dwellStartRef.current) {
          dwellStartRef.current = performance.now();
        } else {
          const elapsed = performance.now() - dwellStartRef.current;
          const prog = Math.min(elapsed / dwellTimeMs, 1.0);
          setDwellProgress(prog);

          if (prog >= 1.0) {
            triggerSyntheticClick(newX, newY);
            dwellStartRef.current = null;
            setDwellProgress(0);
          }
        }
      } else {
        // Reset dwell when hand moves significantly
        dwellTargetRef.current = { x: newX, y: newY };
        dwellStartRef.current = performance.now();
        setDwellProgress(0);
      }
    } else {
      setDwellProgress(0);
    }
  }, [gesture, enabled, speed, dwellClickEnabled, dwellTimeMs, mirrorX, isClicking, triggerSyntheticClick]);

  if (!enabled || !gesture || gesture.type === 'NONE') return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer Circular HUD Reticle */}
        <motion.div
          animate={{
            rotate: isClicking ? 180 : 360,
            scale: isClicking ? 0.75 : hoveredElement ? 1.35 : 1,
          }}
          transition={{
            rotate: { repeat: Infinity, duration: 8, ease: 'linear' },
            scale: { type: 'spring', stiffness: 400, damping: 25 },
          }}
          className={`w-12 h-12 rounded-full border-2 border-dashed ${
            isClicking
              ? 'border-cyan-300 shadow-[0_0_20px_#00f3ff]'
              : hoveredElement
              ? 'border-emerald-400 shadow-[0_0_15px_#10b981]'
              : 'border-cyan-400/80 shadow-[0_0_12px_rgba(0,243,255,0.4)]'
          }`}
        />

        {/* Center Target Point */}
        <div
          className={`absolute w-2.5 h-2.5 rounded-full ${
            isClicking ? 'bg-cyan-200' : hoveredElement ? 'bg-emerald-400' : 'bg-cyan-400'
          }`}
        />

        {/* Crosshair markers */}
        <div className="absolute w-14 h-[1px] bg-cyan-400/40" />
        <div className="absolute h-14 w-[1px] bg-cyan-400/40" />

        {/* Dwell Progress Ring */}
        {dwellClickEnabled && dwellProgress > 0 && (
          <svg className="absolute w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(0, 243, 255, 0.2)"
              strokeWidth="2"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#00f3ff"
              strokeWidth="3"
              strokeDasharray={175.9}
              strokeDashoffset={175.9 * (1 - dwellProgress)}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Gesture label badge floating next to cursor */}
        <div className="absolute left-7 top-2 whitespace-nowrap bg-slate-950/80 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 backdrop-blur-sm">
          {gesture.type}
        </div>
      </div>
    </div>
  );
};
