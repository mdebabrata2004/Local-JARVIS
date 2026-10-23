import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionRegistry } from '@/services/actions/actionRegistry';

describe('Central Action Registry & Safe Command Router', () => {
  let registry: ActionRegistry;

  beforeEach(() => {
    registry = new ActionRegistry();
  });

  it('correctly dispatches registered actions to subscribers', () => {
    const handler = vi.fn();
    registry.subscribe('UNDO', handler);

    const executed = registry.dispatch('UNDO');
    expect(executed).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown or unregistered actions safely', () => {
    const executed = registry.dispatch('NON_EXISTENT_ACTION' as any);
    expect(executed).toBe(false);
  });

  it('enforces module permission bounds (e.g. DRAW_STROKE only in AIR_DRAWING)', () => {
    const drawHandler = vi.fn();
    registry.subscribe('DRAW_STROKE', drawHandler);

    // In COMMAND_CENTER, DRAW_STROKE should be denied
    registry.setActiveModule('COMMAND_CENTER');
    const denied = registry.dispatch('DRAW_STROKE');
    expect(denied).toBe(false);
    expect(drawHandler).not.toHaveBeenCalled();

    // In AIR_DRAWING, DRAW_STROKE should be allowed
    registry.setActiveModule('AIR_DRAWING');
    const allowed = registry.dispatch('DRAW_STROKE');
    expect(allowed).toBe(true);
    expect(drawHandler).toHaveBeenCalledTimes(1);
  });

  it('blocks standard actions when emergency stop is active', () => {
    const handler = vi.fn();
    registry.subscribe('NEXT_TRACK', handler);
    registry.setActiveModule('MEDIA_CENTER');

    // Pause tracking
    registry.setTrackingPaused(true);
    const blocked = registry.dispatch('NEXT_TRACK');
    expect(blocked).toBe(false);
    expect(handler).not.toHaveBeenCalled();

    // Resume tracking
    registry.setTrackingPaused(false);
    const resumed = registry.dispatch('NEXT_TRACK');
    expect(resumed).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
