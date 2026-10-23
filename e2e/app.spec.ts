import { test, expect } from '@playwright/test';

test.describe('LOCAL JARVIS End-to-End System Tests', () => {
  test('initializes cleanly and renders the Command Center HUD', async ({ page }) => {
    await page.goto('/');

    // Check title and brand header
    await expect(page).toHaveTitle(/LOCAL JARVIS/);
    await expect(page.locator('text=LOCAL JARVIS')).toBeVisible();
    await expect(page.locator('text=100% PRIVATE')).toBeVisible();

    // Verify system metrics display
    await expect(page.locator('text=WEBCAM')).toBeVisible();
    await expect(page.locator('text=OFFLINE')).toBeVisible();
  });

  test('navigates seamlessly across primary modules', async ({ page }) => {
    await page.goto('/');

    // Navigate to Air Drawing Studio
    await page.click('button:has-text("Air Drawing Studio")');
    await expect(page.locator('button[title="Glow Neon Brush"]')).toBeVisible();

    // Navigate to 3D Workspace
    await page.click('button:has-text("3D Workspace")');
    await expect(page.locator('text=Insert Primitive')).toBeVisible();
    await expect(page.locator('button:has-text("Cube")')).toBeVisible();

    // Navigate to Virtual Desktop
    await page.click('button:has-text("Virtual Desktop")');
    await expect(page.locator('text=Browser Sandbox Isolation Boundary')).toBeVisible();
    await expect(page.locator('text=BROWSER SANDBOX ACTIVE')).toBeVisible();

    // Navigate to Productivity
    await page.click('button:has-text("Productivity")');
    await expect(page.locator('text=Productivity Suite')).toBeVisible();
    await expect(page.locator('text=Checklists')).toBeVisible();

    // Navigate to Local Files
    await page.click('button:has-text("Local Files")');
    await expect(page.locator('text=Local Files & Project Management')).toBeVisible();
  });

  test('handles camera disabled state and simulated hand mode gracefully', async ({ page }) => {
    await page.goto('/');

    // Navigate to Camera & Vision
    await page.click('button:has-text("Camera & Vision")');
    await expect(page.locator('text=Webcam feed is inactive')).toBeVisible();

    // Enable simulated hand tracking (for test environments without webcam)
    const simButton = page.locator('button:has-text("Simulate Hand")');
    await expect(simButton).toBeVisible();
    await simButton.click();

    // Verify simulated hand becomes active
    await expect(page.locator('text=Simulated Hand: Active')).toBeVisible();
  });

  test('opens and interacts with Command Palette via keyboard and button', async ({ page }) => {
    await page.goto('/');

    // Click Command Palette button in header
    await page.click('button:has-text("Command Palette")');
    await expect(page.locator('input[placeholder*="Type a safe command"]')).toBeVisible();

    // Search for 3D command
    await page.fill('input[placeholder*="Type a safe command"]', '3D');
    await expect(page.locator('text=Open 3D Holographic Workspace')).toBeVisible();

    // Execute via click
    await page.click('text=Open 3D Holographic Workspace');
    await expect(page.locator('text=Insert Primitive')).toBeVisible();
  });

  test('verifies honest unavailable status for native launcher in browser sandbox', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Virtual Desktop")');

    // Confirm capability shows Sandboxed in Web Mode
    await expect(page.locator('text=Sandboxed in Web Mode').first()).toBeVisible();

    // Attempting to launch Notepad should show sandboxed message, not fake success
    const notepadLaunch = page.locator('button:has-text("Launch")').first();
    await notepadLaunch.click();
    await expect(page.locator('text=Native app execution is blocked by the browser sandbox')).toBeVisible();
  });

  test('persists settings modifications in local storage', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Settings")');

    // Toggle mirror video checkbox
    const mirrorCheckbox = page.locator('input[type="checkbox"]').first();
    await mirrorCheckbox.click();

    // Save changes
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Settings successfully saved to local persistent storage.')).toBeVisible();
  });
});
