import { ActionDefinition, ActionId, GestureType, NavigationModule } from '@/types';
import { soundService } from '@/services/sound/soundService';

export const ACTION_DEFINITIONS: Record<ActionId, ActionDefinition> = {
  DRAW_STROKE: {
    id: 'DRAW_STROKE',
    name: 'Draw Air Stroke',
    description: 'Creates a continuous stroke on the 2D canvas using the index fingertip.',
    category: 'Drawing',
    defaultGesture: 'DRAWING_POSE',
    cooldownMs: 0, // Continuous
    allowedInModules: ['AIR_DRAWING'],
  },
  VIRTUAL_CLICK: {
    id: 'VIRTUAL_CLICK',
    name: 'Virtual Select / Click',
    description: 'Triggers a click event at the virtual cursor screen position.',
    category: 'System',
    defaultGesture: 'PINCH',
    cooldownMs: 400,
  },
  CLEAR_CANVAS: {
    id: 'CLEAR_CANVAS',
    name: 'Clear Canvas',
    description: 'Clears all active strokes on the current drawing layer.',
    category: 'Drawing',
    defaultGesture: 'CLOSED_FIST',
    cooldownMs: 1200,
    allowedInModules: ['AIR_DRAWING'],
  },
  UNDO: {
    id: 'UNDO',
    name: 'Undo Action',
    description: 'Reverts the most recent drawing stroke or 3D scene modification.',
    category: 'System',
    defaultGesture: 'SWIPE_LEFT',
    cooldownMs: 500,
  },
  REDO: {
    id: 'REDO',
    name: 'Redo Action',
    description: 'Restores the most recently undone action.',
    category: 'System',
    defaultGesture: 'SWIPE_RIGHT',
    cooldownMs: 500,
  },
  NEXT_TRACK: {
    id: 'NEXT_TRACK',
    name: 'Next Media Track',
    description: 'Advances to the next audio track in the media center playlist.',
    category: 'Media',
    defaultGesture: 'SWIPE_RIGHT',
    cooldownMs: 600,
    allowedInModules: ['MEDIA_CENTER'],
  },
  PREV_TRACK: {
    id: 'PREV_TRACK',
    name: 'Previous Media Track',
    description: 'Returns to previous audio track.',
    category: 'Media',
    defaultGesture: 'SWIPE_LEFT',
    cooldownMs: 600,
    allowedInModules: ['MEDIA_CENTER'],
  },
  PLAY_PAUSE: {
    id: 'PLAY_PAUSE',
    name: 'Play / Pause Media',
    description: 'Toggles audio playback in the local media center.',
    category: 'Media',
    defaultGesture: 'OPEN_PALM',
    cooldownMs: 800,
    allowedInModules: ['MEDIA_CENTER'],
  },
  VOLUME_UP: {
    id: 'VOLUME_UP',
    name: 'Volume Up',
    description: 'Increments application audio volume.',
    category: 'Media',
    defaultGesture: 'SWIPE_UP',
    cooldownMs: 400,
    allowedInModules: ['MEDIA_CENTER'],
  },
  VOLUME_DOWN: {
    id: 'VOLUME_DOWN',
    name: 'Volume Down',
    description: 'Decrements application audio volume.',
    category: 'Media',
    defaultGesture: 'SWIPE_DOWN',
    cooldownMs: 400,
    allowedInModules: ['MEDIA_CENTER'],
  },
  ROTATE_3D: {
    id: 'ROTATE_3D',
    name: 'Rotate 3D Object / Camera',
    description: 'Interactively rotates the selected 3D primitive or orbit camera.',
    category: '3D',
    defaultGesture: 'OPEN_PALM',
    cooldownMs: 0,
    allowedInModules: ['WORKSPACE_3D'],
  },
  SCALE_3D: {
    id: 'SCALE_3D',
    name: 'Scale 3D Object',
    description: 'Scales selected 3D object using two-hand distance.',
    category: '3D',
    defaultGesture: 'TWO_HAND_FRAME',
    cooldownMs: 50,
    allowedInModules: ['WORKSPACE_3D'],
  },
  NAVIGATE_MODULE: {
    id: 'NAVIGATE_MODULE',
    name: 'Navigate to Module',
    description: 'Switches the active workspace module.',
    category: 'Navigation',
    defaultGesture: 'NONE',
    cooldownMs: 500,
  },
  TOGGLE_CAMERA: {
    id: 'TOGGLE_CAMERA',
    name: 'Toggle Camera Stream',
    description: 'Starts or stops the local webcam hardware stream.',
    category: 'System',
    defaultGesture: 'THUMBS_UP',
    cooldownMs: 1000,
  },
  TOGGLE_HUD: {
    id: 'TOGGLE_HUD',
    name: 'Toggle HUD Overlays',
    description: 'Toggles technical overlays and panels for minimal focus mode.',
    category: 'System',
    defaultGesture: 'VICTORY',
    cooldownMs: 800,
  },
  RESET_VIEW: {
    id: 'RESET_VIEW',
    name: 'Reset View / Camera',
    description: 'Resets the 3D scene camera or 2D canvas pan/zoom to default.',
    category: 'System',
    defaultGesture: 'NONE',
    cooldownMs: 500,
  },
  EMERGENCY_STOP: {
    id: 'EMERGENCY_STOP',
    name: 'Emergency Stop All Tracking',
    description: 'Immediately disables all gesture recognition and halts active continuous actions.',
    category: 'System',
    defaultGesture: 'CLOSED_FIST',
    cooldownMs: 1000,
  },
};

type ActionHandler = (data?: any) => void;

export class ActionRegistry {
  private handlers: Map<ActionId, Set<ActionHandler>> = new Map();
  private gestureToActionMap: Map<GestureType, ActionId> = new Map();
  private activeModule: NavigationModule = 'COMMAND_CENTER';
  private trackingPaused: boolean = false;

  constructor() {
    this.resetDefaultMappings();
  }

  public setActiveModule(module: NavigationModule) {
    this.activeModule = module;
  }

  public getActiveModule(): NavigationModule {
    return this.activeModule;
  }

  public setTrackingPaused(paused: boolean) {
    this.trackingPaused = paused;
  }

  public isTrackingPaused(): boolean {
    return this.trackingPaused;
  }

  public resetDefaultMappings() {
    this.gestureToActionMap.clear();
    Object.values(ACTION_DEFINITIONS).forEach((def) => {
      if (def.defaultGesture !== 'NONE') {
        this.gestureToActionMap.set(def.defaultGesture, def.id);
      }
    });
  }

  public mapGestureToAction(gesture: GestureType, actionId: ActionId) {
    this.gestureToActionMap.set(gesture, actionId);
  }

  public getActionForGesture(gesture: GestureType): ActionId | undefined {
    return this.gestureToActionMap.get(gesture);
  }

  public subscribe(actionId: ActionId, handler: ActionHandler): () => void {
    if (!this.handlers.has(actionId)) {
      this.handlers.set(actionId, new Set());
    }
    this.handlers.get(actionId)!.add(handler);

    return () => {
      this.handlers.get(actionId)?.delete(handler);
    };
  }

  public dispatch(actionId: ActionId, data?: any): boolean {
    if (this.trackingPaused && actionId !== 'EMERGENCY_STOP' && actionId !== 'TOGGLE_CAMERA') {
      return false;
    }

    const def = ACTION_DEFINITIONS[actionId];
    if (!def) {
      console.warn(`Attempted to execute unverified action: ${actionId}`);
      return false;
    }

    // Check module permission constraint
    if (def.allowedInModules && !def.allowedInModules.includes(this.activeModule)) {
      // Action not permitted in current workspace context
      return false;
    }

    const callbacks = this.handlers.get(actionId);
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in action callback for ${actionId}:`, err);
        }
      });
      soundService.playActionConfirm();
      return true;
    }

    return false;
  }
}

export const actionRegistry = new ActionRegistry();
