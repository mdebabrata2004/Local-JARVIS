import React, { useState, useEffect } from 'react';
import { SceneCanvas } from './SceneCanvas';
import { SceneInspector } from './SceneInspector';
import { Object3DData, MeshPrimitiveType, Scene3DProject, RecognizedGesture } from '@/types';
import { storageService } from '@/storage/db';
import { soundService } from '@/services/sound/soundService';
import { Grid, Compass, Info } from 'lucide-react';

interface Workspace3DProps {
  gesture: RecognizedGesture | null;
}

const DEFAULT_OBJECTS: Object3DData[] = [
  {
    id: 'obj-reactor-core',
    name: 'Arc Reactor Core',
    type: 'reactor',
    position: { x: 0, y: 0.2, z: 0 },
    rotation: { x: 90, y: 0, z: 0 },
    scale: { x: 1.2, y: 1.2, z: 1.2 },
    color: '#00f3ff',
    wireframe: true,
    roughness: 0.2,
    metalness: 0.8,
    opacity: 0.9,
    visible: true,
  },
  {
    id: 'obj-sphere-orbit',
    name: 'Plasma Sphere',
    type: 'sphere',
    position: { x: 0, y: 0.2, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    color: '#00d2ff',
    wireframe: false,
    roughness: 0.1,
    metalness: 0.9,
    opacity: 0.8,
    visible: true,
  },
];

export const Workspace3D: React.FC<Workspace3DProps> = ({ gesture }) => {
  const [objects, setObjects] = useState<Object3DData[]>(DEFAULT_OBJECTS);
  const [selectedId, setSelectedId] = useState<string | null>('obj-reactor-core');
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [axesVisible, setAxesVisible] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load saved scene on initial mount if available
  useEffect(() => {
    storageService.getAll3DProjects().then((scenes) => {
      if (scenes && scenes.length > 0) {
        const latest = scenes[scenes.length - 1];
        if (latest.objects && latest.objects.length > 0) {
          setObjects(latest.objects);
        }
      }
    });
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleAddObject = (type: MeshPrimitiveType) => {
    soundService.playActionConfirm();
    const newObj: Object3DData = {
      id: `obj-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length + 1}`,
      type,
      position: { x: (Math.random() - 0.5) * 2, y: 0, z: (Math.random() - 0.5) * 2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#00f3ff',
      wireframe: false,
      roughness: 0.3,
      metalness: 0.5,
      opacity: 0.9,
      visible: true,
    };
    setObjects((prev) => [...prev, newObj]);
    setSelectedId(newObj.id);
    showStatus(`Added ${newObj.name}`);
  };

  const handleUpdateObject = (id: string, updates: Partial<Object3DData>) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  };

  const handleDeleteObject = (id: string) => {
    soundService.playClick();
    setObjects((prev) => prev.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
    showStatus('Object removed');
  };

  const handleDuplicateObject = (id: string) => {
    const target = objects.find((o) => o.id === id);
    if (!target) return;
    soundService.playActionConfirm();
    const dup: Object3DData = {
      ...JSON.parse(JSON.stringify(target)),
      id: `obj-${Date.now()}`,
      name: `${target.name} Copy`,
      position: {
        x: target.position.x + 0.5,
        y: target.position.y + 0.2,
        z: target.position.z,
      },
    };
    setObjects((prev) => [...prev, dup]);
    setSelectedId(dup.id);
    showStatus(`Duplicated ${target.name}`);
  };

  const handleSaveScene = async () => {
    const project: Scene3DProject = {
      id: `scene-${Date.now()}`,
      title: 'Holographic Workspace Scene',
      objects,
      cameraPosition: { x: 0, y: 2.5, z: 6 },
      cameraTarget: { x: 0, y: 0, z: 0 },
      gridVisible,
      axesVisible,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await storageService.save3DProject(project);
    soundService.playActionConfirm();
    showStatus('Scene saved to IndexedDB');
  };

  const handleExportScene = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(objects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jarvis-3d-scene-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showStatus('Exported scene JSON');
  };

  const handleImportScene = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setObjects(imported);
          showStatus(`Imported ${imported.length} 3D objects`);
        } else if (imported.objects && Array.isArray(imported.objects)) {
          setObjects(imported.objects);
          showStatus(`Imported ${imported.objects.length} 3D objects`);
        }
      } catch (err) {
        showStatus('Invalid 3D scene JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 relative overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs">
        <button
          onClick={() => setGridVisible(!gridVisible)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition ${
            gridVisible ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>
        <button
          onClick={() => setAxesVisible(!axesVisible)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition ${
            axesVisible ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Axes</span>
        </button>

        {/* Status Toast */}
        {statusMessage && (
          <div className="ml-2 font-mono text-cyan-400 text-[11px] animate-pulse">
            • {statusMessage}
          </div>
        )}
      </div>

      {/* Main 3D Viewport & Inspector */}
      <div className="flex-1 flex w-full h-full relative">
        <div className="flex-1 h-full relative">
          <SceneCanvas
            objects={objects}
            selectedId={selectedId}
            onSelect={setSelectedId}
            gridVisible={gridVisible}
            axesVisible={axesVisible}
            gesture={gesture}
            onUpdateObject={handleUpdateObject}
          />

          {/* Hologram Disclaimer & Gesture Hint Banner */}
          <div className="absolute bottom-4 left-4 right-84 pointer-events-none flex flex-col gap-1.5 text-[11px] font-mono text-cyan-400/80">
            <div className="flex items-center gap-2 bg-slate-950/70 border border-cyan-500/20 px-3 py-1.5 rounded backdrop-blur-sm w-fit">
              <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>
                3D Viewport rendered via WebGL on screen. (Physical holographic projection requires specialized volumetric display).
              </span>
            </div>
            {gesture && gesture.type !== 'NONE' && (
              <div className="bg-slate-950/70 border border-cyan-500/20 px-3 py-1 rounded backdrop-blur-sm w-fit text-[10px] text-cyan-300">
                Active Gesture: <strong className="text-cyan-400">{gesture.type}</strong>
                {gesture.type === 'OPEN_PALM' && ' — Rotating object'}
                {gesture.type === 'PINCH' && ' — Translating object'}
              </div>
            )}
          </div>
        </div>

        {/* Right Inspector Panel */}
        <SceneInspector
          objects={objects}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddObject={handleAddObject}
          onUpdateObject={handleUpdateObject}
          onDeleteObject={handleDeleteObject}
          onDuplicateObject={handleDuplicateObject}
          onSaveScene={handleSaveScene}
          onExportScene={handleExportScene}
          onImportScene={handleImportScene}
        />
      </div>
    </div>
  );
};
