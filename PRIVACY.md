# Privacy Guarantee & Architectural Boundary: LOCAL JARVIS 1.0

## 1. Zero Cloud Architecture

LOCAL JARVIS was engineered from the ground up to respect user privacy and operate completely on-device without cloud dependencies.

* **No Cloud API Calls**: The application does not communicate with any external backend, SaaS API, or remote service.
* **No Telemetry or Tracking**: There are no Google Analytics, PostHog, Mixpanel, Sentry, or other tracking tags embedded.
* **No Remote CDN Fonts or Assets**: Fonts, icons, and sounds are generated locally or packaged as static vectors within the bundle.

---

## 2. Webcam Video Frame Privacy

* **Strict Local Processing**: Video frames captured from your webcam via `navigator.mediaDevices.getUserMedia` are delivered directly to an offscreen HTML5 `<video>` element in your browser's memory.
* **In-Memory WebAssembly Model**: Frames are processed frame-by-frame by Google MediaPipe Tasks Vision running inside WebAssembly on your PC's GPU/CPU.
* **Zero Frame Persistence**: Raw video frames are discarded immediately after 21-landmark coordinate extraction. Frames are never written to disk, never cached, and never transmitted over the network.

---

## 3. Storage & Data Ownership

* **100% Local Storage**: All drawing canvases, 3D scenes, markdown notes, task checklists, and configuration preferences are saved in your local browser's IndexedDB (`local_jarvis_db`) and localStorage.
* **Full Data Portability**: Users can export full JSON backups of all stored projects at any time.
* **Permanent Data Wipe**: A dedicated "Purge All Data" function in the Local Files module completely wipes the database upon user confirmation.

---

## 4. Distinction Regarding V1 AI Features

* **No LLM or Conversational AI**: Generative AI chat assistants are strictly disabled in version 1.0.
* **Computer Vision vs Generative AI**: MediaPipe Hand Landmarker is a geometric computer vision model that outputs $(x, y, z)$ coordinates of hand joints. It does not transcribe speech, analyze personal identity, or generate natural language.
