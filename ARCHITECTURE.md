# Architecture & Technical Design: LOCAL JARVIS 1.0

## 1. High-Level Architecture Overview

LOCAL JARVIS is constructed with a modular, decoupled architecture adhering to strict local-first and privacy-preserving design principles.

```
+-----------------------------------------------------------------------------------+
|                                 Presentation Layer                                |
|  - Main Navigation Shell & Top Status Bar                                         |
|  - 12 Interactive Modules (Command Center, Air Drawing, 3D Workspace, etc.)       |
|  - Virtual Cursor Reticle & Dwell Click Engine                                    |
|  - Mirror Mode Immersive Fullscreen HUD                                           |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                              Input & Perception Layer                             |
|  - CameraService (MediaDevices getUserMedia stream manager)                       |
|  - HandLandmarkerService (@mediapipe/tasks-vision local WASM in VIDEO mode)       |
|  - Hand Simulation Provider (Deterministic synthetic landmarks)                   |
|  - GestureRecognitionEngine (Geometric feature extraction & classification)       |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             Control & Dispatch Layer                              |
|  - ActionRegistry (Strict permission boundaries & module scoping)                 |
|  - Gesture Mapping Engine (Cooldown state machine & transition filters)           |
|  - Command Router & Command Palette (Strict allowlist of safe operations)         |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         Persistence & Integration Layer                           |
|  - IndexedDB (idb wrapper: Drawings, 3D Scenes, Notes, Tasks, Drafts)             |
|  - LocalStorage (Immediate UI preferences)                                        |
|  - Web Audio Synthesizer (Zero-asset procedural procedural HUD sound FX)          |
|  - DesktopBridgeService (Tauri Windows IPC interface & Sandbox boundary gates)    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Structure

```
src/
  ├── app/                  # Application root entrypoint
  ├── components/           # Global HUD components
  │   ├── NavigationSidebar.tsx
  │   ├── TopStatusBar.tsx
  │   └── CommandPalette.tsx
  ├── features/             # Modular feature domains
  │   ├── about/            # Documentation & Gesture reference
  │   ├── camera/           # Video preview & landmark skeleton
  │   ├── dashboard/        # Command center status & real metrics
  │   ├── desktop-bridge/   # Capability registry & sandbox boundaries
  │   ├── diagnostics/      # Benchmarks, FPS, WebGL analyzer
  │   ├── drawing/          # 2D Canvas engine, Bezier smoothing, layers
  │   ├── gestures/         # Mapping editor & sensitivity sliders
  │   ├── media/            # Audio player, spectrum visualizer, synth
  │   ├── mirror-mode/      # Fullscreen camera pass-through HUD
  │   ├── productivity/     # Markdown notes, checklists, timers
  │   ├── projects/         # File management & backup JSON export/import
  │   ├── settings/         # Configuration, themes, privacy toggles
  │   ├── virtual-cursor/   # Screen coordinate mapper & dwell selector
  │   └── workspace3d/      # Three.js / React Three Fiber scene & primitives
  ├── services/             # Core singleton services
  │   ├── actions/          # Central action registry
  │   ├── camera/           # Hardware video stream service
  │   ├── desktop-bridge/   # Native bridge adapter
  │   ├── gestures/         # Geometric gesture classifier
  │   ├── hand-tracking/    # MediaPipe HandLandmarker wrapper
  │   └── sound/            # Web Audio API sound synthesizer
  ├── storage/              # IndexedDB database client
  ├── styles/               # Tailwind CSS & futuristic HUD classes
  ├── tests/                # Vitest unit test suites
  └── types/                # Strict TypeScript definitions
public/
  ├── models/               # Local MediaPipe hand_landmarker.task model
  ├── wasm/                 # Local MediaPipe Tasks Vision WASM assets
  └── favicon.svg           # Futuristic HUD icon
```

---

## 3. Computer Vision & Landmark Pipeline

1. **Hardware Acquisition**: `CameraService` acquires a `MediaStream` using `navigator.mediaDevices.getUserMedia` with configurable resolutions (`640x480`, `1280x720`, `1920x1080`).
2. **Local Model Evaluation**: `HandLandmarkerService` passes video frames into MediaPipe Tasks Vision in `VIDEO` mode:
   ```ts
   const results = landmarker.detectForVideo(videoElement, timestamp);
   ```
3. **Landmark Normalization & EMA Smoothing**:
   Raw coordinates (0.0 to 1.0) for each of the 21 hand joints undergo Exponential Moving Average (EMA) smoothing:
   $$S_t = \alpha \cdot X_t + (1 - \alpha) \cdot S_{t-1}$$
   where $\alpha$ is configurable via the smoothing factor slider.
4. **Geometric Gesture Classification**:
   `GestureRecognitionEngine` computes relative Euclidean distances and joint angles:
   * **Tip-to-Wrist Ratios**: Detects extension vs. curled fingers.
   * **Fingertip Proximity**: Computes 2D distance between thumb tip (`landmark 4`) and index tip (`landmark 8`) to detect `PINCH`.
   * **Dynamic Velocity**: Evaluates palm center trajectory over a 300ms window to register `SWIPE_LEFT`, `SWIPE_RIGHT`, `SWIPE_UP`, and `SWIPE_DOWN`.
5. **Cooldown State Machine**:
   Prevents repeating discrete actions when holding a gesture continuously. Ensures each trigger requires either entering a new pose or exceeding the configured cooldown duration (default 350ms).

---

## 4. 2D Drawing Mathematics & Smoothing

The `DrawingEngine` utilizes HTML5 Canvas with quadratic Bezier curve interpolation:
* When receiving point stream $(p_0, p_1, p_2, \dots)$, control points are derived as midpoints between sequential coordinates:
  $$xc = \frac{x_i + x_{i+1}}{2}, \quad yc = \frac{y_i + y_{i+1}}{2}$$
* This eliminates jagged angles and produces fluid, organic strokes.
* Stroke lifecycles are strictly coupled to hand tracking visibility: when tracking is momentarily lost or the drawing pose terminates, the active stroke is finalized. New strokes never connect across tracking interruptions.

---

## 5. 3D Spatial Workspace Architecture

Built using Three.js and React Three Fiber:
* **Scene Graph**: Manages objects in standard hierarchical structure with local transforms (Position, Rotation, Scale).
* **Gesture Manipulation**:
  * `OPEN_PALM`: Modifies rotation matrix about the Y/X axes.
  * `PINCH`: Translates the selected primitive across the camera plane.
  * `TWO_HAND_FRAME`: Scales the selected mesh proportionally to the Euclidean distance between left and right hand centers.
* **Exporting**: Serializes scene objects to JSON and standard Wavefront `.obj` geometries.

---

## 6. Procedural Audio Synthesizer

Rather than depending on external audio files that could fail to load offline, LOCAL JARVIS includes a Web Audio API procedural synthesizer:
* Generates sine, triangle, and sawtooth waves with exponential decay envelopes for HUD clicks, selection chimes, warnings, and ambient drone background sound.
* Zero external assets required.
