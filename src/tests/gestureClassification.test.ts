import { describe, it, expect, beforeEach } from 'vitest';
import { GestureRecognitionEngine } from '@/services/gestures/gestureEngine';
import { HandLandmarkerService } from '@/services/hand-tracking/handLandmarkerService';

describe('Gesture Recognition Engine', () => {
  let engine: GestureRecognitionEngine;
  let landmarker: HandLandmarkerService;

  beforeEach(() => {
    engine = new GestureRecognitionEngine();
    landmarker = new HandLandmarkerService();
  });

  it('correctly classifies a DRAWING_POSE gesture', () => {
    const hand = landmarker.generateSimulatedHand(0.5, 0.5, 'DRAWING_POSE');
    const result = engine.classify(hand);

    expect(result.type).toBe('DRAWING_POSE');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.position).toBeDefined();
  });

  it('correctly classifies an OPEN_PALM gesture', () => {
    const hand = landmarker.generateSimulatedHand(0.5, 0.5, 'OPEN_PALM');
    const result = engine.classify(hand);

    expect(result.type).toBe('OPEN_PALM');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('correctly classifies a CLOSED_FIST gesture', () => {
    const hand = landmarker.generateSimulatedHand(0.5, 0.5, 'CLOSED_FIST');
    const result = engine.classify(hand);

    expect(result.type).toBe('CLOSED_FIST');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('correctly classifies a PINCH gesture', () => {
    const hand = landmarker.generateSimulatedHand(0.5, 0.5, 'PINCH');
    const result = engine.classify(hand);

    expect(result.type).toBe('PINCH');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('respects gesture disable toggle', () => {
    engine.updateConfig({
      enabledGestures: {
        ...engine.getConfig().enabledGestures,
        CLOSED_FIST: false,
      },
    });

    const hand = landmarker.generateSimulatedHand(0.5, 0.5, 'CLOSED_FIST');
    const result = engine.classify(hand);

    expect(result.type).not.toBe('CLOSED_FIST');
  });
});
