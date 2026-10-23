import React from 'react';
import {
  Box,
  Circle,
  Cylinder,
  Disc,
  Layers,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Download,
  Upload,
  Save,
  Plus,
} from 'lucide-react';
import { Object3DData, MeshPrimitiveType } from '@/types';

interface SceneInspectorProps {
  objects: Object3DData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddObject: (type: MeshPrimitiveType) => void;
  onUpdateObject: (id: string, updates: Partial<Object3DData>) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (id: string) => void;
  onSaveScene: () => void;
  onExportScene: () => void;
  onImportScene: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  objects,
  selectedId,
  onSelect,
  onAddObject,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onSaveScene,
  onExportScene,
  onImportScene,
}) => {
  const selectedObj = objects.find((o) => o.id === selectedId);

  return (
    <aside className="w-80 h-full bg-slate-950/80 border-l border-cyan-500/20 backdrop-blur-md flex flex-col text-slate-200 text-xs select-none overflow-y-auto">
      {/* Top Header */}
      <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold tracking-wider uppercase text-cyan-300">3D Workspace</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSaveScene}
            title="Save Scene locally"
            className="p-1 hover:bg-cyan-500/20 text-cyan-400 rounded transition"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onExportScene}
            title="Export Scene JSON"
            className="p-1 hover:bg-cyan-500/20 text-cyan-400 rounded transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <label
            title="Import Scene JSON"
            className="p-1 hover:bg-cyan-500/20 text-cyan-400 rounded cursor-pointer transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={onImportScene} className="hidden" />
          </label>
        </div>
      </div>

      {/* Add Primitives Palette */}
      <div className="p-3 border-b border-cyan-500/20">
        <span className="text-[10px] uppercase font-mono text-cyan-400/70 mb-2 block tracking-wider">
          Insert Primitive
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onAddObject('cube')}
            className="flex flex-col items-center gap-1 p-2 bg-slate-900/60 hover:bg-cyan-500/20 border border-cyan-500/20 rounded hover:border-cyan-400 transition"
          >
            <Box className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px]">Cube</span>
          </button>
          <button
            onClick={() => onAddObject('sphere')}
            className="flex flex-col items-center gap-1 p-2 bg-slate-900/60 hover:bg-cyan-500/20 border border-cyan-500/20 rounded hover:border-cyan-400 transition"
          >
            <Circle className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px]">Sphere</span>
          </button>
          <button
            onClick={() => onAddObject('cylinder')}
            className="flex flex-col items-center gap-1 p-2 bg-slate-900/60 hover:bg-cyan-500/20 border border-cyan-500/20 rounded hover:border-cyan-400 transition"
          >
            <Cylinder className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px]">Cylinder</span>
          </button>
          <button
            onClick={() => onAddObject('torus')}
            className="flex flex-col items-center gap-1 p-2 bg-slate-900/60 hover:bg-cyan-500/20 border border-cyan-500/20 rounded hover:border-cyan-400 transition"
          >
            <Disc className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px]">Torus</span>
          </button>
          <button
            onClick={() => onAddObject('reactor')}
            className="col-span-4 flex items-center justify-center gap-2 p-2 bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-300 transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono tracking-wide">Arc Reactor Core</span>
          </button>
        </div>
      </div>

      {/* Object Hierarchy Tree */}
      <div className="p-3 border-b border-cyan-500/20 max-h-48 overflow-y-auto">
        <span className="text-[10px] uppercase font-mono text-cyan-400/70 mb-2 block tracking-wider">
          Scene Hierarchy ({objects.length})
        </span>
        <div className="space-y-1">
          {objects.map((obj) => (
            <div
              key={obj.id}
              onClick={() => onSelect(obj.id)}
              className={`flex items-center justify-between p-1.5 rounded cursor-pointer border ${
                selectedId === obj.id
                  ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900/40 border-transparent hover:border-cyan-500/30 text-slate-300'
              }`}
            >
              <span className="truncate max-w-[130px] font-mono">{obj.name}</span>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onUpdateObject(obj.id, { visible: !obj.visible })}
                  className="p-1 hover:text-cyan-400"
                >
                  {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                </button>
                <button onClick={() => onDuplicateObject(obj.id)} className="p-1 hover:text-cyan-400">
                  <Copy className="w-3 h-3" />
                </button>
                <button onClick={() => onDeleteObject(obj.id)} className="p-1 hover:text-rose-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {objects.length === 0 && (
            <div className="text-slate-500 text-center py-4 font-mono text-[11px]">
              No objects in scene
            </div>
          )}
        </div>
      </div>

      {/* Selected Object Property Inspector */}
      {selectedObj ? (
        <div className="p-3 space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
            <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[11px]">
              Object Properties
            </span>
            <span className="font-mono text-[10px] text-cyan-400/80">{selectedObj.type}</span>
          </div>

          {/* Name input */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Name</label>
            <input
              type="text"
              value={selectedObj.name}
              onChange={(e) => onUpdateObject(selectedObj.id, { name: e.target.value })}
              className="w-full bg-slate-900 border border-cyan-500/30 rounded px-2 py-1 text-slate-200 font-mono focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Transform: Position */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 block mb-1">Position (X, Y, Z)</span>
            <div className="grid grid-cols-3 gap-1">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <div key={axis} className="flex items-center bg-slate-900 border border-cyan-500/20 rounded px-1.5 py-0.5">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase mr-1">{axis}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedObj.position[axis]}
                    onChange={(e) =>
                      onUpdateObject(selectedObj.id, {
                        position: { ...selectedObj.position, [axis]: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-transparent text-right font-mono outline-none text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Transform: Scale */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 block mb-1">Scale (X, Y, Z)</span>
            <div className="grid grid-cols-3 gap-1">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <div key={axis} className="flex items-center bg-slate-900 border border-cyan-500/20 rounded px-1.5 py-0.5">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase mr-1">{axis}</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={selectedObj.scale[axis]}
                    onChange={(e) =>
                      onUpdateObject(selectedObj.id, {
                        scale: { ...selectedObj.scale, [axis]: Math.max(0.1, parseFloat(e.target.value) || 1) },
                      })
                    }
                    className="w-full bg-transparent text-right font-mono outline-none text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Material & Color */}
          <div className="space-y-2 pt-2 border-t border-cyan-500/10">
            <span className="text-[10px] font-mono text-slate-400 block">Material & Hologram</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedObj.color}
                  onChange={(e) => onUpdateObject(selectedObj.id, { color: e.target.value })}
                  className="w-6 h-6 bg-transparent border-0 cursor-pointer rounded"
                />
                <span className="font-mono text-[10px]">{selectedObj.color}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Wireframe</span>
              <input
                type="checkbox"
                checked={selectedObj.wireframe}
                onChange={(e) => onUpdateObject(selectedObj.id, { wireframe: e.target.checked })}
                className="rounded accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Opacity</span>
                <span>{Math.round(selectedObj.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={selectedObj.opacity}
                onChange={(e) => onUpdateObject(selectedObj.id, { opacity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-slate-500 font-mono text-xs">
          Select an object to inspect and modify properties.
        </div>
      )}
    </aside>
  );
};
