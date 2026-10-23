import { describe, it, expect, beforeEach } from 'vitest';
import { DrawingEngine } from '@/features/drawing/drawingEngine';

describe('Drawing Engine', () => {
  let canvas: HTMLCanvasElement;
  let engine: DrawingEngine;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    engine = new DrawingEngine({
      canvas,
      width: 800,
      height: 600,
    });
  });

  it('initializes with default layer and tools', () => {
    expect(engine.getLayers().length).toBe(1);
    expect(engine.getTool()).toBe('glow');
    expect(engine.getColor()).toBe('#00f3ff');
  });

  it('correctly maps and mirrors normalized coordinates into canvas pixels', () => {
    // startStroke at normalized (x=0.25, y=0.5) with mirrorX = true
    // Expected x = (1.0 - 0.25) * 800 = 600; y = 0.5 * 600 = 300
    engine.startStroke(0.25, 0.5, true);
    engine.addPoint(0.25, 0.6, true);
    engine.endStroke();

    const project = engine.toProject('Test');
    expect(project.strokes.length).toBe(1);
    const stroke = project.strokes[0];
    expect(stroke.points[0].x).toBe(600);
    expect(stroke.points[0].y).toBe(300);
  });

  it('manages undo and redo stacks correctly', () => {
    expect(engine.undo()).toBe(false);

    // Draw first stroke
    engine.startStroke(0.1, 0.1, false);
    engine.addPoint(0.2, 0.2, false);
    engine.endStroke();

    // Draw second stroke
    engine.startStroke(0.3, 0.3, false);
    engine.addPoint(0.4, 0.4, false);
    engine.endStroke();

    expect(engine.toProject().strokes.length).toBe(2);

    // Undo second stroke
    const undone = engine.undo();
    expect(undone).toBe(true);
    expect(engine.toProject().strokes.length).toBe(1);

    // Redo second stroke
    const redone = engine.redo();
    expect(redone).toBe(true);
    expect(engine.toProject().strokes.length).toBe(2);
  });

  it('clears canvas and allows undoing clear', () => {
    engine.startStroke(0.1, 0.1, false);
    engine.addPoint(0.2, 0.2, false);
    engine.endStroke();
    expect(engine.toProject().strokes.length).toBe(1);

    engine.clearAll();
    expect(engine.toProject().strokes.length).toBe(0);

    // Undoing clear should restore previous strokes
    engine.undo();
    expect(engine.toProject().strokes.length).toBe(1);
  });

  it('exports valid SVG markup with stroke paths', () => {
    engine.setColor('#00f3ff');
    engine.setWidth(8);
    engine.startStroke(0.1, 0.1, false);
    engine.addPoint(0.5, 0.5, false);
    engine.endStroke();

    const svg = engine.exportSVG();
    expect(svg).toContain('<svg');
    expect(svg).toContain('stroke="#00f3ff"');
    expect(svg).toContain('stroke-width="8"');
  });

  it('terminates stroke when gesture is interrupted and avoids joining across gaps', () => {
    engine.startStroke(0.1, 0.1, false);
    engine.addPoint(0.2, 0.2, false);
    engine.endStroke(); // tracking lost

    // New stroke begins later at a different location
    engine.startStroke(0.8, 0.8, false);
    engine.addPoint(0.9, 0.9, false);
    engine.endStroke();

    const strokes = engine.toProject().strokes;
    expect(strokes.length).toBe(2);
    // Verified separate distinct strokes
    expect(strokes[0].id).not.toBe(strokes[1].id);
  });
});
