import { describe, it, expect } from 'vitest';
import { DrawingProject, Scene3DProject } from '@/types';

describe('Project Serialization and Schema Validation', () => {
  it('serializes and deserializes drawing projects without data loss', () => {
    const original: DrawingProject = {
      id: 'proj-123',
      title: 'Holographic Wireframe Blueprint',
      width: 1920,
      height: 1080,
      layers: [{ id: 'l1', name: 'Layer 1', visible: true, locked: false, opacity: 1.0 }],
      strokes: [
        {
          id: 's1',
          tool: 'glow',
          color: '#00f3ff',
          width: 5,
          opacity: 0.9,
          points: [
            { x: 100, y: 150, timestamp: 1000 },
            { x: 120, y: 180, timestamp: 1050 },
          ],
          layerId: 'l1',
        },
      ],
      createdAt: 1700000000000,
      updatedAt: 1700000050000,
    };

    const serialized = JSON.stringify(original);
    const deserialized: DrawingProject = JSON.parse(serialized);

    expect(deserialized.id).toBe(original.id);
    expect(deserialized.strokes.length).toBe(1);
    expect(deserialized.strokes[0].points.length).toBe(2);
    expect(deserialized.strokes[0].color).toBe('#00f3ff');
  });

  it('validates 3D scene project structure', () => {
    const scene: Scene3DProject = {
      id: 'scene-999',
      title: 'Arc Reactor Spatial Rig',
      objects: [
        {
          id: 'obj-1',
          name: 'Core Torus',
          type: 'reactor',
          position: { x: 0, y: 1, z: 0 },
          rotation: { x: 90, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#00f3ff',
          wireframe: true,
          roughness: 0.2,
          metalness: 0.8,
          opacity: 1,
          visible: true,
        },
      ],
      cameraPosition: { x: 0, y: 2, z: 5 },
      cameraTarget: { x: 0, y: 0, z: 0 },
      gridVisible: true,
      axesVisible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const json = JSON.stringify(scene);
    const parsed = JSON.parse(json);

    expect(parsed.objects[0].type).toBe('reactor');
    expect(parsed.objects[0].wireframe).toBe(true);
    expect(parsed.cameraPosition.z).toBe(5);
  });
});
