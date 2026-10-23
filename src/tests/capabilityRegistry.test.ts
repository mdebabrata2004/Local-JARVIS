import { describe, it, expect } from 'vitest';
import {
  DesktopBridgeService,
  SAFE_ALLOWLISTED_APPS,
} from '@/services/desktop-bridge/desktopBridgeService';

describe('Desktop Capability Registry & Safety Boundaries', () => {
  it('correctly marks native OS launcher as unavailable in browser sandbox', () => {
    const bridge = new DesktopBridgeService();
    const capabilities = bridge.getCapabilities();

    const appLauncher = capabilities.find((c) => c.id === 'APP_LAUNCHER');
    expect(appLauncher).toBeDefined();
    expect(appLauncher?.availableInBrowser).toBe(false);
    expect(appLauncher?.requiresNativeBridge).toBe(true);
    expect(appLauncher?.status).toBe('unavailable');
  });

  it('maintains a strictly safe, non-arbitrary application allowlist', () => {
    expect(SAFE_ALLOWLISTED_APPS.length).toBeGreaterThan(0);

    // Verify all allowlisted apps are safe standard utilities
    SAFE_ALLOWLISTED_APPS.forEach((app) => {
      expect(['Notepad', 'Windows Calculator', 'MS Paint', 'Windows File Explorer']).toContain(
        app.name
      );
      expect(app.path).not.toContain('powershell');
      expect(app.path).not.toContain('cmd.exe');
    });
  });

  it('rejects unallowlisted arbitrary application IDs', async () => {
    const bridge = new DesktopBridgeService();
    const result = await bridge.launchAllowlistedApp('malicious_target');

    expect(result.success).toBe(false);
    expect(result.message).toContain('not in the safe allowlist');
  });

  it('returns honest error when native bridge is absent in browser mode', async () => {
    const bridge = new DesktopBridgeService();
    const result = await bridge.launchAllowlistedApp('notepad');

    expect(result.success).toBe(false);
    expect(result.message).toContain('blocked by the browser sandbox');
  });
});
