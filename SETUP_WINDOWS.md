# Windows 10/11 Setup Guide: LOCAL JARVIS 1.0

## 1. System Requirements

* **Operating System**: Windows 10 (64-bit) or Windows 11.
* **Hardware**:
  * Minimum: Intel Core i3 or AMD Ryzen 3, 4GB RAM, Integrated Graphics (Intel UHD / Radeon Vega).
  * Recommended: Intel Core i5/i7 or AMD Ryzen 5/7, 8GB+ RAM, Dedicated GPU with WebGL 2.0 support.
  * Camera: Any standard USB webcam or integrated laptop webcam (720p or 1080p @ 30 FPS).
* **Software**:
  * Node.js v18.0.0 or higher.
  * Modern Web Browser: Microsoft Edge, Google Chrome, or Brave.

---

## 2. Installation Steps

### Step 1: Install Node.js
If Node.js is not already installed on your Windows PC:
1. Download the LTS installer from [nodejs.org](https://nodejs.org/).
2. Run the `.msi` installer and ensure **Add to PATH** is selected.

### Step 2: Extract & Install Dependencies
Open **Windows PowerShell** or **Windows Terminal**:
```powershell
# Navigate to the workspace
cd "C:\My Projects\Local JARVIS"

# Install project dependencies
npm install
```

### Step 3: Verify Pre-Bundled Model Assets
The MediaPipe computer vision model and WebAssembly runtime files are pre-packaged locally:
* Model: `public/models/hand_landmarker.task` (7.8 MB)
* WASM binaries: `public/wasm/vision_wasm_internal.wasm`, etc.

To confirm the assets are present in PowerShell:
```powershell
Get-ChildItem -Path "public/models", "public/wasm"
```

### Step 4: Launch LOCAL JARVIS
```powershell
npm run dev
```
PowerShell will output:
```
  VITE v5.3.1  ready in 450 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```
Open **Microsoft Edge** or **Google Chrome** and navigate to `http://localhost:3000`.

---

## 3. Windows Camera Permissions

When launching LOCAL JARVIS for the first time:
1. Click the **Enable Camera** button on the Top Status Bar or Camera tab.
2. The browser will present a native permission dialog:  
   *"localhost:3000 wants to use your camera"*.
3. Click **Allow**.
4. If camera permission was previously blocked in Windows Settings:
   * Open **Windows Settings** (`Win + I`).
   * Go to **Privacy & Security** -> **Camera**.
   * Ensure **Camera access** and **Let desktop apps access your camera** are toggled **ON**.
