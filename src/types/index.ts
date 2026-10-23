/**
 * Core Type Definitions for LOCAL JARVIS 1.0
 */

// ==========================================
// 1. Hand Tracking & Landmarks
// ==========================================

export interface NormalizedLandmark {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  z: number; // relative depth
  visibility?: number;
}

export interface HandLandmarkData {
  landmarks: NormalizedLandmark[]; // 21 landmarks
  worldLandmarks?: NormalizedLandmark[];
  handedness: 'Left' | 'Right';
  confidence: number;
}

export interface TrackingFrame {
  hands: HandLandmarkData[];
  timestamp: number;
  fps: number;
}

export type Handedness = 'Left' | 'Right';

// Landmarks index reference:
// 0: WRIST
// 1-4: THUMB (CMC, MCP, IP, TIP)
// 5-8: INDEX (MCP, PIP, DIP, TIP)
// 9-12: MIDDLE (MCP, PIP, DIP, TIP)
// 13-16: RING (MCP, PIP, DIP, TIP)
// 17-20: PINKY (MCP, PIP, DIP, TIP)
export const LANDMARK_INDEX = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

// ==========================================
// 2. Gesture Recognition
// ==========================================

export type GestureType =
  | 'NONE'
  | 'INDEX_POINT'        // Pointing with index finger
  | 'DRAWING_POSE'       // Index extended, others curled (pen pose)
  | 'OPEN_PALM'          // All 5 fingers extended
  | 'CLOSED_FIST'        // All fingers curled
  | 'VICTORY'            // Index and middle fingers extended
  | 'THUMBS_UP'          // Thumb up, other fingers curled
  | 'PINCH'              // Thumb tip close to index tip
  | 'PINCH_MIDDLE'       // Thumb tip close to middle tip
  | 'TWO_HAND_FRAME'     // Both hands forming viewfinder / distance
  | 'SWIPE_LEFT'         // Rapid left hand movement
  | 'SWIPE_RIGHT'        // Rapid right hand movement
  | 'SWIPE_UP'           // Rapid upward hand movement
  | 'SWIPE_DOWN'         // Rapid downward hand movement
  | 'DWELL';             // Lingering in one location

export interface RecognizedGesture {
  type: GestureType;
  confidence: number;
  handedness: Handedness;
  position: { x: number; y: number }; // Normalized screen coords (0-1)
  timestamp: number;
  duration: number; // how long current gesture has been continuously held (ms)
}

// ==========================================
// 3. Central Action Registry
// ==========================================

export type ActionId =
  | 'DRAW_STROKE'
  | 'VIRTUAL_CLICK'
  | 'CLEAR_CANVAS'
  | 'UNDO'
  | 'REDO'
  | 'NEXT_TRACK'
  | 'PREV_TRACK'
  | 'PLAY_PAUSE'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'ROTATE_3D'
  | 'SCALE_3D'
  | 'NAVIGATE_MODULE'
  | 'TOGGLE_CAMERA'
  | 'TOGGLE_HUD'
  | 'RESET_VIEW'
  | 'EMERGENCY_STOP';

export interface ActionDefinition {
  id: ActionId;
  name: string;
  description: string;
  category: 'System' | 'Drawing' | '3D' | 'Media' | 'Navigation';
  defaultGesture: GestureType;
  cooldownMs: number;
  allowedInModules?: NavigationModule[];
}

export interface GestureMappingConfig {
  gesture: GestureType;
  actionId: ActionId;
  enabled: boolean;
  cooldownMs: number;
  minConfidence: number;
}

// ==========================================
// 4. Navigation & Modules
// ==========================================

export type NavigationModule =
  | 'COMMAND_CENTER'
  | 'CAMERA_TRACKING'
  | 'AIR_DRAWING'
  | 'WORKSPACE_3D'
  | 'VIRTUAL_DESKTOP'
  | 'MEDIA_CENTER'
  | 'PRODUCTIVITY'
  | 'LOCAL_FILES'
  | 'GESTURE_MAPPING'
  | 'SETTINGS'
  | 'DIAGNOSTICS'
  | 'ABOUT_HELP';

// ==========================================
// 5. Air Drawing Studio
// ==========================================

export type DrawingTool = 'brush' | 'eraser' | 'highlighter' | 'glow' | 'line' | 'rectangle' | 'circle' | 'arrow';

export interface Point2D {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface StrokePath {
  id: string;
  tool: DrawingTool;
  color: string;
  width: number;
  opacity: number;
  points: Point2D[];
  layerId: string;
}

export interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface DrawingProject {
  id: string;
  title: string;
  width: number;
  height: number;
  layers: DrawingLayer[];
  strokes: StrokePath[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // base64 preview
}

// ==========================================
// 6. 3D Workspace
// ==========================================

export type MeshPrimitiveType = 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'plane' | 'reactor';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Object3DData {
  id: string;
  name: string;
  type: MeshPrimitiveType;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  color: string;
  wireframe: boolean;
  roughness: number;
  metalness: number;
  opacity: number;
  visible: boolean;
}

export interface Scene3DProject {
  id: string;
  title: string;
  objects: Object3DData[];
  cameraPosition: Vector3D;
  cameraTarget: Vector3D;
  gridVisible: boolean;
  axesVisible: boolean;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// 7. Productivity Module
// ==========================================

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: number;
  completedAt?: number;
}

export interface TimerSession {
  type: 'stopwatch' | 'timer' | 'pomodoro';
  durationSeconds: number;
  elapsedSeconds: number;
  isRunning: boolean;
  laps?: number[];
}

export interface PlannerEntry {
  id: string;
  timeSlot: string; // "09:00", "10:00", etc.
  title: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

// ==========================================
// 8. Desktop Capabilities & Native Bridge
// ==========================================

export interface DesktopCapability {
  id: string;
  name: string;
  description: string;
  availableInBrowser: boolean;
  requiresNativeBridge: boolean;
  status: 'available' | 'restricted' | 'unavailable' | 'mocked_for_test';
  permissionGranted: boolean;
}

export interface AllowlistedApp {
  id: string;
  name: string;
  path: string;
  category: string;
  icon?: string;
}

// ==========================================
// 9. Application Settings
// ==========================================

export interface AppSettings {
  // Camera
  cameraId: string;
  cameraResolution: '640x480' | '1280x720' | '1920x1080';
  mirrorVideo: boolean;
  maxHands: 1 | 2;
  
  // Tracking & Gestures
  minDetectionConfidence: number; // 0.1 to 1.0
  minTrackingConfidence: number; // 0.1 to 1.0
  smoothingFactor: number; // 0.0 to 1.0 (EMA alpha)
  gestureCooldownMs: number; // default 400ms
  
  // Virtual Cursor
  virtualCursorEnabled: boolean;
  cursorSpeed: number; // 1 to 5
  dwellClickEnabled: boolean;
  dwellTimeMs: number; // 500ms to 2000ms
  
  // UI & Visuals
  theme: 'cyber-cyan' | 'midnight-blue' | 'stealth-dark';
  glowIntensity: 'low' | 'medium' | 'high' | 'off';
  scanlinesEnabled: boolean;
  gridBackdropEnabled: boolean;
  hudAudioFeedback: boolean;
  hudSpeechSynthesis: boolean; // Local browser TTS
  
  // Storage & Diagnostics
  autoSaveIntervalSec: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
