import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DrawingProject, Scene3DProject, NoteItem, TaskItem, PlannerEntry, AppSettings } from '@/types';

export const DEFAULT_SETTINGS: AppSettings = {
  cameraId: 'default',
  cameraResolution: '1280x720',
  mirrorVideo: true,
  maxHands: 2,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  smoothingFactor: 0.6,
  gestureCooldownMs: 350,
  virtualCursorEnabled: true,
  cursorSpeed: 2.5,
  dwellClickEnabled: true,
  dwellTimeMs: 900,
  theme: 'cyber-cyan',
  glowIntensity: 'medium',
  scanlinesEnabled: true,
  gridBackdropEnabled: true,
  hudAudioFeedback: true,
  hudSpeechSynthesis: false, // Default false to respect user voice preferences
  autoSaveIntervalSec: 15,
  logLevel: 'info',
};

interface JarvisDB extends DBSchema {
  drawingProjects: {
    key: string;
    value: DrawingProject;
    indexes: { 'by-updated': number };
  };
  scene3dProjects: {
    key: string;
    value: Scene3DProject;
    indexes: { 'by-updated': number };
  };
  notes: {
    key: string;
    value: NoteItem;
    indexes: { 'by-updated': number };
  };
  tasks: {
    key: string;
    value: TaskItem;
    indexes: { 'by-status': string; 'by-priority': string };
  };
  planner: {
    key: string;
    value: PlannerEntry;
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: any;
  };
  recoveryDrafts: {
    key: string;
    value: { id: string; type: string; data: any; savedAt: number };
  };
}

const DB_NAME = 'local_jarvis_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<JarvisDB>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<JarvisDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JarvisDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('drawingProjects')) {
          const store = db.createObjectStore('drawingProjects', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('scene3dProjects')) {
          const store = db.createObjectStore('scene3dProjects', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('notes')) {
          const store = db.createObjectStore('notes', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('tasks')) {
          const store = db.createObjectStore('tasks', { keyPath: 'id' });
          store.createIndex('by-status', 'status');
          store.createIndex('by-priority', 'priority');
        }
        if (!db.objectStoreNames.contains('planner')) {
          const store = db.createObjectStore('planner', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('recoveryDrafts')) {
          db.createObjectStore('recoveryDrafts', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// Storage API Helpers
export const storageService = {
  // --- Drawing Projects ---
  async saveDrawingProject(project: DrawingProject): Promise<void> {
    const db = await getDatabase();
    await db.put('drawingProjects', { ...project, updatedAt: Date.now() });
  },

  async getDrawingProject(id: string): Promise<DrawingProject | undefined> {
    const db = await getDatabase();
    return db.get('drawingProjects', id);
  },

  async getAllDrawingProjects(): Promise<DrawingProject[]> {
    const db = await getDatabase();
    return db.getAllFromIndex('drawingProjects', 'by-updated');
  },

  async deleteDrawingProject(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('drawingProjects', id);
  },

  // --- 3D Scene Projects ---
  async save3DProject(project: Scene3DProject): Promise<void> {
    const db = await getDatabase();
    await db.put('scene3dProjects', { ...project, updatedAt: Date.now() });
  },

  async get3DProject(id: string): Promise<Scene3DProject | undefined> {
    const db = await getDatabase();
    return db.get('scene3dProjects', id);
  },

  async getAll3DProjects(): Promise<Scene3DProject[]> {
    const db = await getDatabase();
    return db.getAllFromIndex('scene3dProjects', 'by-updated');
  },

  async delete3DProject(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('scene3dProjects', id);
  },

  // --- Productivity Notes ---
  async saveNote(note: NoteItem): Promise<void> {
    const db = await getDatabase();
    await db.put('notes', { ...note, updatedAt: Date.now() });
  },

  async getAllNotes(): Promise<NoteItem[]> {
    const db = await getDatabase();
    return db.getAllFromIndex('notes', 'by-updated');
  },

  async deleteNote(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('notes', id);
  },

  // --- Productivity Tasks ---
  async saveTask(task: TaskItem): Promise<void> {
    const db = await getDatabase();
    await db.put('tasks', task);
  },

  async getAllTasks(): Promise<TaskItem[]> {
    const db = await getDatabase();
    return db.getAll('tasks');
  },

  async deleteTask(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('tasks', id);
  },

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    try {
      const db = await getDatabase();
      const saved = await db.get('settings', 'app_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...saved };
      }
      // fallback to localStorage
      const local = localStorage.getItem('jarvis_app_settings');
      if (local) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
      }
    } catch (e) {
      console.warn('Could not read settings from DB, using defaults', e);
    }
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      const db = await getDatabase();
      await db.put('settings', updated, 'app_settings');
      localStorage.setItem('jarvis_app_settings', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving settings', e);
    }
  },

  // --- Recovery Drafts ---
  async saveDraft(id: string, type: string, data: any): Promise<void> {
    const db = await getDatabase();
    await db.put('recoveryDrafts', { id, type, data, savedAt: Date.now() });
  },

  async getDraft(id: string): Promise<any> {
    const db = await getDatabase();
    return db.get('recoveryDrafts', id);
  },

  async clearDraft(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('recoveryDrafts', id);
  },

  // --- Storage Statistics & Purge ---
  async getStorageStats(): Promise<{
    drawingCount: number;
    sceneCount: number;
    noteCount: number;
    taskCount: number;
    estimatedBytes: number;
  }> {
    const db = await getDatabase();
    const drawings = await db.count('drawingProjects');
    const scenes = await db.count('scene3dProjects');
    const notes = await db.count('notes');
    const tasks = await db.count('tasks');
    
    let estimatedBytes = 0;
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      estimatedBytes = est.usage || 0;
    }

    return {
      drawingCount: drawings,
      sceneCount: scenes,
      noteCount: notes,
      taskCount: tasks,
      estimatedBytes,
    };
  },

  async purgeAllData(): Promise<void> {
    const db = await getDatabase();
    await db.clear('drawingProjects');
    await db.clear('scene3dProjects');
    await db.clear('notes');
    await db.clear('tasks');
    await db.clear('planner');
    await db.clear('recoveryDrafts');
    localStorage.removeItem('jarvis_app_settings');
  },
};
