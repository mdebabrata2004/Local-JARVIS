/**
 * Desktop Capabilities Registry and Tauri Native Bridge Adapter
 * 
 * In standard browser environments, native OS commands are sandboxed.
 * This service provides honest capability detection, permission gates,
 * and an interface for an optional Tauri Windows backend.
 */

import { DesktopCapability, AllowlistedApp } from '@/types';

// Pre-vetted allowlist of Windows utility applications (strictly no arbitrary paths or scripts)
export const SAFE_ALLOWLISTED_APPS: AllowlistedApp[] = [
  {
    id: 'notepad',
    name: 'Notepad',
    path: 'C:\\Windows\\System32\\notepad.exe',
    category: 'Editor',
  },
  {
    id: 'calculator',
    name: 'Windows Calculator',
    path: 'calc.exe',
    category: 'Utility',
  },
  {
    id: 'paint',
    name: 'MS Paint',
    path: 'mspaint.exe',
    category: 'Graphics',
  },
  {
    id: 'explorer',
    name: 'Windows File Explorer',
    path: 'explorer.exe',
    category: 'Files',
  },
];

export class DesktopBridgeService {
  private isTauriAvailable: boolean = false;
  private permissions: Map<string, boolean> = new Map();

  constructor() {
    this.detectEnvironment();
  }

  private detectEnvironment() {
    // Check if running inside a Tauri webview window
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      this.isTauriAvailable = true;
    } else {
      this.isTauriAvailable = false;
    }
  }

  public getCapabilities(): DesktopCapability[] {
    return [
      {
        id: 'APP_LAUNCHER',
        name: 'Allowlisted App Launcher',
        description: 'Launch vetted Windows applications (Notepad, Calculator, Paint) with user confirmation.',
        availableInBrowser: false,
        requiresNativeBridge: true,
        status: this.isTauriAvailable ? 'available' : 'unavailable',
        permissionGranted: this.permissions.get('APP_LAUNCHER') || false,
      },
      {
        id: 'SYSTEM_VOLUME',
        name: 'System-Wide Volume Control',
        description: 'Adjust Windows master audio output volume directly.',
        availableInBrowser: false,
        requiresNativeBridge: true,
        status: this.isTauriAvailable ? 'available' : 'unavailable',
        permissionGranted: this.permissions.get('SYSTEM_VOLUME') || false,
      },
      {
        id: 'SCREENSHOT',
        name: 'Screen Capture API',
        description: 'Capture active workspace screenshot using browser GetDisplayMedia or native API.',
        availableInBrowser: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia,
        requiresNativeBridge: false,
        status: 'available',
        permissionGranted: this.permissions.get('SCREENSHOT') || false,
      },
      {
        id: 'SYSTEM_NOTIFICATIONS',
        name: 'Desktop Notifications',
        description: 'Display system notifications for timers and completed tasks.',
        availableInBrowser: typeof window !== 'undefined' && 'Notification' in window,
        requiresNativeBridge: false,
        status: typeof window !== 'undefined' && 'Notification' in window ? 'available' : 'restricted',
        permissionGranted: typeof Notification !== 'undefined' && Notification.permission === 'granted',
      },
      {
        id: 'LOCAL_FILE_ACCESS',
        name: 'File System Access API',
        description: 'Open and save files directly to user-selected folders using browser File System Access API.',
        availableInBrowser: typeof window !== 'undefined' && 'showOpenFilePicker' in window,
        requiresNativeBridge: false,
        status: typeof window !== 'undefined' && 'showOpenFilePicker' in window ? 'available' : 'restricted',
        permissionGranted: true,
      },
      {
        id: 'HARDWARE_SENSORS',
        name: 'Direct CPU/GPU Hardware Sensors',
        description: 'Direct reading of raw Windows hardware temperature and fan telemetry.',
        availableInBrowser: false,
        requiresNativeBridge: true,
        status: 'unavailable',
        permissionGranted: false,
      },
    ];
  }

  public isNativeBridgeConnected(): boolean {
    return this.isTauriAvailable;
  }

  public async requestCapabilityPermission(capabilityId: string): Promise<boolean> {
    if (capabilityId === 'SYSTEM_NOTIFICATIONS') {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        this.permissions.set(capabilityId, granted);
        return granted;
      }
      return false;
    }

    if (capabilityId === 'SCREENSHOT') {
      this.permissions.set(capabilityId, true);
      return true;
    }

    if (!this.isTauriAvailable) {
      throw new Error(
        `Capability "${capabilityId}" requires the optional Tauri Windows Desktop Bridge. In standard browser mode, native OS execution is restricted by the browser sandbox.`
      );
    }

    this.permissions.set(capabilityId, true);
    return true;
  }

  public async launchAllowlistedApp(appId: string): Promise<{ success: boolean; message: string }> {
    const app = SAFE_ALLOWLISTED_APPS.find((a) => a.id === appId);
    if (!app) {
      return { success: false, message: `Application "${appId}" is not in the safe allowlist.` };
    }

    if (!this.isTauriAvailable) {
      return {
        success: false,
        message: `Native app execution is blocked by the browser sandbox. To launch ${app.name}, the optional Tauri desktop bridge is required.`,
      };
    }

    try {
      const tauri = (window as any).__TAURI__;
      await tauri.invoke('launch_allowlisted_app', { appId: app.id });
      return { success: true, message: `Launched ${app.name} successfully.` };
    } catch (err: any) {
      return { success: false, message: `Failed to launch ${app.name}: ${err.message || err}` };
    }
  }

  public async captureScreen(): Promise<Blob | null> {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen capture is not supported in this browser.');
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach((track) => track.stop());

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } catch (err: any) {
      console.warn('Screen capture cancelled or denied:', err);
      return null;
    }
  }
}

export const desktopBridge = new DesktopBridgeService();
