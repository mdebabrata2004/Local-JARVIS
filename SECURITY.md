# Security Architecture & Sandbox Model: LOCAL JARVIS 1.0

## 1. Browser Sandbox Boundaries

LOCAL JARVIS operates within standard modern browser security sandboxes (Chromium, Gecko, WebKit):
* **No Unrestricted Filesystem Access**: The browser cannot scan arbitrary Windows folders (`C:\Windows`, `C:\Users`, etc.). File interactions occur strictly through explicit user file pickers via the browser File System Access API or `<input type="file">`.
* **No Arbitrary OS Command Execution**: Hand gestures and air commands can never invoke PowerShell, Bash, Command Prompt, or launch arbitrary `.exe` or `.bat` files.
* **No Global Keyboard Hooks**: Hand tracking and gestures only interact with the active web application window.

---

## 2. Central Action Registry & Capability Checks

All actions dispatched in the application must pass through the `ActionRegistry`:
1. **Allowlist Verification**: Action identifiers must be present in `ACTION_DEFINITIONS`. Any unknown or unverified action ID is rejected.
2. **Module Scoping**: Specific actions are restricted to relevant modules (e.g. `DRAW_STROKE` can only execute while viewing `AIR_DRAWING`).
3. **Emergency Stop**: Engaging the emergency stop state suspends all action dispatching until explicitly resumed by the user.

---

## 3. Desktop Bridge Security (Tauri Windows Integration)

For environments running with the optional Tauri Windows Desktop Bridge:
* **Strict Application Allowlist**: Only vetted utilities (Notepad, Calculator, Paint, File Explorer) can be launched.
* **No Dynamic Command Strings**: No user input or gesture data is concatenated into shell command strings.
* **Explicit Consent Gate**: The application requests explicit user confirmation before launching any allowlisted program.
* **Least-Privilege IPC**: IPC channels are isolated to strictly typed commands.
