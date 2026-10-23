import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  NavigationModule,
  RecognizedGesture,
  HandLandmarkData,
  AppSettings,
} from '@/types';
import { storageService, DEFAULT_SETTINGS } from '@/storage/db';
import { cameraService } from '@/services/camera/cameraService';
import { handLandmarkerService } from '@/services/hand-tracking/handLandmarkerService';
import { gestureEngine } from '@/services/gestures/gestureEngine';
import { actionRegistry } from '@/services/actions/actionRegistry';
import { soundService } from '@/services/sound/soundService';

import { NavigationSidebar } from '@/components/NavigationSidebar';
import { TopStatusBar } from '@/components/TopStatusBar';
import { CommandPalette } from '@/components/CommandPalette';
import { VirtualCursor } from '@/features/virtual-cursor/VirtualCursor';

import { CommandCenter } from '@/features/dashboard/CommandCenter';
import { CameraTrackingView } from '@/features/camera/CameraTrackingView';
import { AirDrawingStudio } from '@/features/drawing/AirDrawingStudio';
import { Workspace3D } from '@/features/workspace3d/Workspace3D';
import { VirtualDesktopView } from '@/features/desktop-bridge/VirtualDesktopView';
import { MediaCenterView } from '@/features/media/MediaCenterView';
import { ProductivityView } from '@/features/productivity/ProductivityView';
import { LocalFilesView } from '@/features/projects/LocalFilesView';
import { GestureMappingView } from '@/features/gestures/GestureMappingView';
import { SettingsView } from '@/features/settings/SettingsView';
import { DiagnosticsView } from '@/features/diagnostics/DiagnosticsView';
import { AboutHelpView } from '@/features/about/AboutHelpView';
import { MirrorModeView } from '@/features/mirror-mode/MirrorModeView';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentModule, setCurrentModule] = useState<NavigationModule>('COMMAND_CENTER');
  const [isMirrorMode, setIsMirrorMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Vision & Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [hands, setHands] = useState<HandLandmarkData[]>([]);
  const [currentGesture, setCurrentGesture] = useState<RecognizedGesture | null>(null);
  const [fps, setFps] = useState<number>(0);

  const animFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  // Load Settings on Mount
  useEffect(() => {
    storageService.getSettings().then((s) => {
      setSettings(s);
      soundService.setEnabled(s.hudAudioFeedback);
      soundService.setSpeechEnabled(s.hudSpeechSynthesis);
    });

    // Initialize local hand landmarker asynchronously
    handLandmarkerService
      .initialize()
      .catch((err) => console.warn('MediaPipe initialization warning:', err));

    return () => {
      cameraService.stopCamera();
      handLandmarkerService.dispose();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Update Action Registry active module
  useEffect(() => {
    actionRegistry.setActiveModule(currentModule);
  }, [currentModule]);

  // Toggle Camera
  const handleToggleCamera = useCallback(async () => {
    if (isCameraActive) {
      cameraService.stopCamera();
      setIsCameraActive(false);
      setHands([]);
      setCurrentGesture(null);
      setFps(0);
      soundService.playClick();
    } else {
      try {
        await cameraService.startCamera(settings.cameraId, settings.cameraResolution);
        const video = cameraService.getVideo();
        setVideoElement(video);
        setIsCameraActive(true);
        soundService.playActionConfirm();
      } catch (err: any) {
        alert(err.message || 'Camera failed to start.');
      }
    }
  }, [isCameraActive, settings.cameraId, settings.cameraResolution]);

  // Vision Processing Animation Frame Loop
  useEffect(() => {
    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);

      // Calculate Frame Rate
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      // Check if real video or simulated hand is active
      const video = cameraService.getVideo();
      const isSimulating = handLandmarkerService.isSimulating();

      if ((isCameraActive && video) || isSimulating) {
        const frame = handLandmarkerService.detect(video || (document.createElement('video')), settings.smoothingFactor);
        setHands(frame.hands);

        if (frame.hands.length > 0) {
          const primaryHand = frame.hands[0];
          const recognized = gestureEngine.classify(primaryHand, frame.hands);
          setCurrentGesture(recognized);

          // Route gesture to action registry with cooldown verification
          if (recognized.type !== 'NONE' && gestureEngine.canTriggerAction(recognized.type)) {
            const mappedAction = actionRegistry.getActionForGesture(recognized.type);
            if (mappedAction) {
              actionRegistry.dispatch(mappedAction, recognized);
            }
          }
        } else {
          setCurrentGesture(null);
        }
      } else {
        setHands([]);
        setCurrentGesture(null);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraActive, settings.smoothingFactor]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleToggleCamera();
      } else if (e.key === 'Escape' && isMirrorMode) {
        setIsMirrorMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleCamera, isMirrorMode]);

  return (
    <div
      className={`w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans relative ${
        settings.gridBackdropEnabled ? 'tech-grid' : ''
      }`}
    >
      {/* Subtle CRT Scanline Overlay if enabled */}
      {settings.scanlinesEnabled && (
        <div className="absolute inset-0 scanline-overlay pointer-events-none z-50 opacity-20" />
      )}

      {/* Global Virtual Cursor Reticle */}
      <VirtualCursor
        enabled={settings.virtualCursorEnabled}
        gesture={currentGesture}
        speed={settings.cursorSpeed}
        dwellClickEnabled={settings.dwellClickEnabled}
        dwellTimeMs={settings.dwellTimeMs}
        mirrorX={settings.mirrorVideo}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(mod) => {
          setIsMirrorMode(false);
          setCurrentModule(mod);
        }}
        onToggleCamera={handleToggleCamera}
      />

      {/* Fullscreen Mirror Mode View */}
      {isMirrorMode ? (
        <MirrorModeView
          isCameraActive={isCameraActive}
          onToggleCamera={handleToggleCamera}
          videoElement={videoElement}
          gesture={currentGesture}
          hands={hands}
          onNavigate={(mod) => {
            setIsMirrorMode(false);
            setCurrentModule(mod);
          }}
        />
      ) : (
        <>
          {/* Top Status Header */}
          <TopStatusBar
            currentModule={currentModule}
            isCameraActive={isCameraActive}
            onToggleCamera={handleToggleCamera}
            gesture={currentGesture}
            fps={fps}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            audioFeedback={settings.hudAudioFeedback}
            onToggleAudioFeedback={() => {
              const next = !settings.hudAudioFeedback;
              setSettings((s) => ({ ...s, hudAudioFeedback: next }));
              storageService.saveSettings({ hudAudioFeedback: next });
              soundService.setEnabled(next);
            }}
          />

          {/* Body: Sidebar + Active Module Viewport */}
          <div className="flex-1 flex overflow-hidden relative">
            <NavigationSidebar
              currentModule={currentModule}
              onNavigate={(mod) => setCurrentModule(mod)}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onOpenMirrorMode={() => setIsMirrorMode(true)}
            />

            {/* Main Interactive Module Container */}
            <main className="flex-1 h-full overflow-hidden relative">
              {currentModule === 'COMMAND_CENTER' && (
                <CommandCenter
                  onNavigate={(mod) => setCurrentModule(mod)}
                  isCameraActive={isCameraActive}
                  onToggleCamera={handleToggleCamera}
                  gesture={currentGesture}
                  fps={fps}
                />
              )}
              {currentModule === 'CAMERA_TRACKING' && (
                <CameraTrackingView
                  isCameraActive={isCameraActive}
                  onToggleCamera={handleToggleCamera}
                  gesture={currentGesture}
                  hands={hands}
                  smoothing={settings.smoothingFactor}
                  onSmoothingChange={(val) => {
                    setSettings((s) => ({ ...s, smoothingFactor: val }));
                    storageService.saveSettings({ smoothingFactor: val });
                  }}
                  confidence={settings.minDetectionConfidence}
                  onConfidenceChange={(val) => {
                    setSettings((s) => ({ ...s, minDetectionConfidence: val }));
                    storageService.saveSettings({ minDetectionConfidence: val });
                  }}
                  videoElement={videoElement}
                />
              )}
              {currentModule === 'AIR_DRAWING' && (
                <AirDrawingStudio
                  gesture={currentGesture}
                  videoElement={videoElement}
                  isCameraActive={isCameraActive}
                />
              )}
              {currentModule === 'WORKSPACE_3D' && (
                <Workspace3D gesture={currentGesture} />
              )}
              {currentModule === 'VIRTUAL_DESKTOP' && <VirtualDesktopView />}
              {currentModule === 'MEDIA_CENTER' && (
                <MediaCenterView gesture={currentGesture} />
              )}
              {currentModule === 'PRODUCTIVITY' && <ProductivityView />}
              {currentModule === 'LOCAL_FILES' && <LocalFilesView />}
              {currentModule === 'GESTURE_MAPPING' && (
                <GestureMappingView currentGesture={currentGesture} />
              )}
              {currentModule === 'SETTINGS' && (
                <SettingsView
                  settings={settings}
                  onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
                />
              )}
              {currentModule === 'DIAGNOSTICS' && <DiagnosticsView fps={fps} />}
              {currentModule === 'ABOUT_HELP' && <AboutHelpView />}
            </main>
          </div>
        </>
      )}
    </div>
  );
};
