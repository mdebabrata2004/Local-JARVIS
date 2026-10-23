# Troubleshooting Guide: LOCAL JARVIS 1.0

## 1. Camera & Tracking Issues

### "Camera permission denied by user or system policy"
* **Cause**: The browser or Windows OS has blocked camera access for this application.
* **Resolution**:
  1. Click the lock or camera icon on the left side of your browser's address bar (`http://localhost:3000`).
  2. Set **Camera** to **Allow**.
  3. Check Windows OS settings: Go to **Settings** -> **Privacy & Security** -> **Camera**, and ensure access is enabled.

### "No compatible video camera hardware was found"
* **Cause**: No webcam is connected, or another application (e.g. Zoom, Teams, OBS) is holding an exclusive hardware lock.
* **Resolution**:
  1. Close any other software using your camera.
  2. If testing without physical hardware, switch to **Simulate Hand (No Cam)** on the **Camera & Vision** tab to test all gesture features immediately using synthetic landmark playback.

### Hand Tracking Jitter or Lag
* **Cause**: Low ambient lighting, low camera framerate, or high CPU usage.
* **Resolution**:
  1. Ensure adequate front lighting on your hands.
  2. Go to **Settings** and set **Camera Resolution** to `640x480` for maximum framerate throughput.
  3. Increase the **Smoothing Factor (EMA)** to `0.70` or `0.80` to filter high-frequency sensor noise.

---

## 2. 3D Workspace & WebGL Issues

### "WebGL context lost" or Black 3D Scene Viewport
* **Cause**: Your GPU driver crashed or disabled hardware acceleration.
* **Resolution**:
  1. Open your browser settings and verify **Use graphics acceleration when available** is enabled.
  2. Check **Diagnostics** tab to inspect WebGL renderer and vendor information.
  3. Update your graphics card drivers (NVIDIA, AMD, or Intel Arc).

---

## 3. Storage & Data Persistence

### Projects Disappeared or Reset
* **Cause**: Private/Incognito browsing mode automatically purges IndexedDB and localStorage upon window closure.
* **Resolution**:
  1. Run LOCAL JARVIS in a normal browser profile rather than Incognito mode.
  2. Regularly export full database backups via **Local Files** -> **Export Backup (.json)**.

---

## 4. Desktop Controls & Native Bridge

### "Native app execution is blocked by the browser sandbox"
* **Explanation**: This is an intentional security boundary. Web browsers run inside secure sandboxes and cannot launch arbitrary Windows `.exe` files directly from web pages.
* **Resolution**: To enable native application launching, build and run the optional Tauri Windows desktop wrapper (`src-tauri/`) which connects over a verified IPC channel.
