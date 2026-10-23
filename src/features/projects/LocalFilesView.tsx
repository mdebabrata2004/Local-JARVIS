import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { storageService } from '@/storage/db';
import { DrawingProject, Scene3DProject, NoteItem } from '@/types';
import { soundService } from '@/services/sound/soundService';

export const LocalFilesView: React.FC = () => {
  const [drawings, setDrawings] = useState<DrawingProject[]>([]);
  const [scenes, setScenes] = useState<Scene3DProject[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [storageStats, setStorageStats] = useState<{
    drawingCount: number;
    sceneCount: number;
    noteCount: number;
    taskCount: number;
    estimatedBytes: number;
  }>({
    drawingCount: 0,
    sceneCount: 0,
    noteCount: 0,
    taskCount: 0,
    estimatedBytes: 0,
  });

  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAll = async () => {
    const d = await storageService.getAllDrawingProjects();
    const s = await storageService.getAll3DProjects();
    const n = await storageService.getAllNotes();
    const stats = await storageService.getStorageStats();

    setDrawings(d);
    setScenes(s);
    setNotes(n);
    setStorageStats(stats);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Export full JSON Backup
  const handleExportFullBackup = async () => {
    soundService.playActionConfirm();
    const fullBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      drawings,
      scenes,
      notes,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `jarvis-local-backup-${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showFeedback('Full database backup exported to JSON');
  };

  // Import JSON Backup with Schema Validation
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON schema');
        }

        let importedCount = 0;
        if (Array.isArray(parsed.drawings)) {
          for (const d of parsed.drawings) {
            if (d.id && d.title) {
              await storageService.saveDrawingProject(d);
              importedCount++;
            }
          }
        }
        if (Array.isArray(parsed.scenes)) {
          for (const s of parsed.scenes) {
            if (s.id && s.title) {
              await storageService.save3DProject(s);
              importedCount++;
            }
          }
        }
        if (Array.isArray(parsed.notes)) {
          for (const n of parsed.notes) {
            if (n.id && n.title) {
              await storageService.saveNote(n);
              importedCount++;
            }
          }
        }

        await loadAll();
        soundService.playActionConfirm();
        showFeedback(`Successfully verified and restored ${importedCount} items.`);
      } catch (err: any) {
        soundService.playWarning();
        showFeedback(`Import error: ${err.message || 'Invalid backup structure'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteDrawing = async (id: string) => {
    soundService.playClick();
    await storageService.deleteDrawingProject(id);
    await loadAll();
    showFeedback('Drawing project deleted');
  };

  const handleDeleteScene = async (id: string) => {
    soundService.playClick();
    await storageService.delete3DProject(id);
    await loadAll();
    showFeedback('3D scene deleted');
  };

  const handlePurgeAll = async () => {
    soundService.playWarning();
    await storageService.purgeAllData();
    await loadAll();
    setConfirmPurgeOpen(false);
    showFeedback('All local application databases purged.');
  };

  return (
    <div className="w-full h-full p-6 bg-slate-950 overflow-y-auto select-none space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            Local Files & Project Management
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Browser File System Access API & IndexedDB Persistent Storage Subsystem
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFullBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/20 rounded-lg text-xs font-mono transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export Backup (.json)
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-400 rounded-lg text-xs font-mono cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Import Backup
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-400/50 rounded-lg text-xs font-mono text-cyan-300">
          {feedback}
        </div>
      )}

      {/* Storage Metrics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Air Drawings</span>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{storageStats.drawingCount} Projects</div>
        </div>
        <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">3D Scenes</span>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{storageStats.sceneCount} Scenes</div>
        </div>
        <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Notes & Tasks</span>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {storageStats.noteCount + storageStats.taskCount} Records
          </div>
        </div>
        <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">IndexedDB Usage</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {(storageStats.estimatedBytes / (1024 * 1024)).toFixed(2)} MB
          </div>
        </div>
      </div>

      {/* Air Drawing Projects Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Saved Air Drawing Projects ({drawings.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {drawings.map((d) => (
            <div
              key={d.id}
              className="p-3 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-2 flex flex-col justify-between"
            >
              <div>
                {d.thumbnail ? (
                  <img
                    src={d.thumbnail}
                    alt={d.title}
                    className="w-full h-28 object-contain bg-slate-950 rounded border border-cyan-500/10 mb-2"
                  />
                ) : (
                  <div className="w-full h-28 bg-slate-950 rounded flex items-center justify-center font-mono text-xs text-slate-600 mb-2">
                    No Preview
                  </div>
                )}
                <h4 className="font-semibold text-xs text-slate-100 truncate">{d.title}</h4>
                <div className="text-[10px] font-mono text-slate-500">
                  {d.strokes?.length || 0} strokes • {new Date(d.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-cyan-500/10">
                <button
                  onClick={() => handleDeleteDrawing(d.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {drawings.length === 0 && (
            <div className="col-span-full text-center py-8 font-mono text-xs text-slate-500">
              No air drawings saved. Open the Air Drawing Studio and click Save.
            </div>
          )}
        </div>
      </div>

      {/* 3D Scene Projects Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Saved 3D Workspace Scenes ({scenes.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {scenes.map((s) => (
            <div
              key={s.id}
              className="p-3 bg-slate-900/40 border border-cyan-500/20 rounded-xl space-y-2 flex flex-col justify-between"
            >
              <div>
                <h4 className="font-semibold text-xs text-slate-100 truncate">{s.title}</h4>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  {s.objects?.length || 0} 3D objects • {new Date(s.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-cyan-500/10">
                <button
                  onClick={() => handleDeleteScene(s.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                  title="Delete Scene"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {scenes.length === 0 && (
            <div className="col-span-full text-center py-6 font-mono text-xs text-slate-500">
              No 3D scenes saved.
            </div>
          )}
        </div>
      </div>

      {/* Database Purge Danger Zone */}
      <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-rose-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Danger Zone: Purge All Local Storage
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Permanently wipes all drawing projects, 3D scenes, notes, and local settings from IndexedDB.
            </p>
          </div>
          <button
            onClick={() => setConfirmPurgeOpen(true)}
            className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-600 border border-rose-500 text-rose-200 text-xs font-mono rounded-lg transition"
          >
            Purge All Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmPurgeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/60 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-hud-glow">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Database Purge
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete all local projects and settings? This operation cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmPurgeOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeAll}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition"
              >
                Permanently Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
