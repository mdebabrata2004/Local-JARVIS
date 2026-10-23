# LOCAL JARVIS 1.0

> **Futuristic Local-First Interactive Workspace for Windows 10/11**  
> Powered by on-device computer vision hand tracking, WebGL 3D spatial scenes, HTML5 canvas air drawing, and local persistent storage.

---

## 1. Project Philosophy & Guarantees

* **100% Local-First & On-Device**: All webcam computer vision processing, drawing mathematics, 3D rendering, and storage occur directly inside your Windows browser via WebAssembly, WebGL, and IndexedDB.
* **AI Assistant Strictly Disabled for V1**: No LLMs, generative AI chatbots, remote AI APIs, or external agents are included in Version 1.0. Clean extensible interfaces are established for future offline AI modules.
* **Zero Cloud Backends or Telemetry**: No camera frames, audio samples, project files, or telemetry are ever transmitted to any remote server or CDN at runtime.
* **Deterministic Hand Tracking**: Uses on-device Google MediaPipe Hand Landmarker (`VIDEO` mode) bundled with local offline WASM binaries and pre-downloaded model assets in `public/models/`.

---

## 2. Key Modules & Features

1. **Command Center**: Real-time HUD with system telemetry (CPU threads, device memory, display resolution, battery, frame rate), recent projects, and quick navigation.
2. **Camera & Vision Tracking**: Live mirrored video feed with 21-landmark skeleton visualizer, fingertip tracking reticles, confidence sliders, smoothing controls, and simulated hand mode for non-webcam environments.
3. **Air Drawing Studio**: Fullscreen 2D drawing canvas operated by index fingertip pointing gestures. Features Catmull-Rom/Bezier curve smoothing, glowing brushes, shape tools (line, rectangle, circle), multi-layer support, undo/redo history, symmetry mirror guides, and PNG/SVG export.
4. **3D Workspace**: Three.js & React Three Fiber interactive scene with 3D primitives (Cube, Sphere, Cylinder, Torus, Arc Reactor Core), orbit controls, transform inspector, material properties, gesture manipulation (Open Palm rotate, Pinch translate, Two-Hand scale), and scene JSON/OBJ export.
5. **Virtual Desktop & Capability Registry**: Honest capability detection and desktop control panel demonstrating sandbox isolation boundaries and safe allowlist execution with optional Tauri desktop bridge.
6. **Media Center**: Local audio playback using HTML5 Audio & Web Audio API spectrum visualizer. Includes procedural ambient synth drone and gesture shortcuts (Swipe Right next, Swipe Left prev, Open Palm play/pause).
7. **Productivity Suite**: Offline markdown notes editor, task checklists with priority tags, precision stopwatch, Pomodoro focus timer, and instant scratchpad.
8. **Local Files & Project Management**: Persistent storage using IndexedDB and browser File System Access API, full JSON backup export/import with schema validation, and storage purge tools.
9. **Gesture Recognition & Mapping**: Centralized geometric classifier mapping 12 distinct hand gestures to safe actions with configurable cooldowns, sensitivity, and visual feedback.
10. **Settings & Privacy**: Camera selector, resolution modes, cursor acceleration, dwell click accessibility, theme options, HUD audio synthesis, and privacy status.
11. **Diagnostics**: Real-time FPS benchmarks, WebGL renderer inspection, MediaPipe WASM model status, and input latency tests.
12. **About & Help**: Detailed hand gesture reference manual, keyboard shortcuts cheatsheet, and optical hologram vs screen HUD technical explanation.
13. **Mirror HUD Mode**: Fullscreen immersive mode overlaying translucent holographic HUD widgets directly on top of your mirrored webcam video feed.
14. **Command Palette (`Ctrl+K`)**: Rapid keyboard command launcher with safe, finite allowlisted commands and local speech synthesis confirmation.

---

## 3. Quick Start & Commands

### Prerequisites
* Windows 10/11 PC with webcam (built-in or USB).
* Node.js v18.0.0 or higher (Node 20+ recommended).
* Modern Chromium-based browser (Google Chrome, Microsoft Edge, Brave) or Firefox.

### Installation
```bash
# Clone or enter project directory
cd "Local JARVIS"

# Install dependencies
npm install
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Production Build
```bash
npm run build
```

### Run Automated Unit Tests
```bash
npm run test
```

### Run End-to-End Browser Tests
```bash
npm run test:e2e
```

### Type Checking & Linting
```bash
npm run typecheck
npm run lint
```

---

## 4. Model Asset Provenance

* **Model File**: `public/models/hand_landmarker.task`
* **WASM Runtime**: `public/wasm/vision_wasm_internal.wasm`, `public/wasm/vision_wasm_internal.js`, etc.
* **Origin**: Official Google MediaPipe Tasks Vision (`float16` edition).
* **License**: Apache License 2.0.
* **Offline Execution**: Loaded directly from the local static directory without CDN roundtrips.
