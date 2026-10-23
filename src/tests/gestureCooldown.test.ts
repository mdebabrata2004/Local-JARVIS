import { describe, it, expect } from 'vitest';
import { GestureRecognitionEngine } from '@/services/gestures/gestureEngine';

describe('Gesture Cooldown and State Transitions', () => {
  it('enforces cooldown intervals between discrete action triggers', async () => {
    const engine = new GestureRecognitionEngine({ cooldownMs: 200 });

    // First trigger should succeed
    const firstAttempt = engine.canTriggerAction('PINCH');
    expect(firstAttempt).toBe(true);

    // Immediate second trigger within cooldown should fail
    const immediateAttempt = engine.canTriggerAction('PINCH');
    expect(immediateAttempt).toBe(false);

    // Wait for cooldown to expire
    await new Promise((resolve) => setTimeout(resolve, 220));

    // After cooldown, trigger should succeed again
    const postCooldownAttempt = engine.canTriggerAction('PINCH');
    expect(postCooldownAttempt).toBe(true);
  });
});
