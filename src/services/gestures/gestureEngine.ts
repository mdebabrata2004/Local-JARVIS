import {
  HandLandmarkData,
  NormalizedLandmark,
  GestureType,
  RecognizedGesture,
  LANDMARK_INDEX as IDX,
} from '@/types';

export interface GestureEngineConfig {
  cooldownMs: number;
  activationDelayMs: number;
  pinchThreshold: number;
  swipeVelocityThreshold: number;
  enabledGestures: Record<GestureType, boolean>;
}

export const DEFAULT_GESTURE_CONFIG: GestureEngineConfig = {
  cooldownMs: 350,
  activationDelayMs: 60,
  pinchThreshold: 0.055,
  swipeVelocityThreshold: 0.45, // normalized units per second
  enabledGestures: {
    NONE: true,
    INDEX_POINT: true,
    DRAWING_POSE: true,
    OPEN_PALM: true,
    CLOSED_FIST: true,
    VICTORY: true,
    THUMBS_UP: true,
    PINCH: true,
    PINCH_MIDDLE: true,
    TWO_HAND_FRAME: true,
    SWIPE_LEFT: true,
    SWIPE_RIGHT: true,
    SWIPE_UP: true,
    SWIPE_DOWN: true,
    DWELL: true,
  },
};

export class GestureRecognitionEngine {
  private config: GestureEngineConfig = { ...DEFAULT_GESTURE_CONFIG };
  private activeGesture: GestureType = 'NONE';
  private gestureStartTime: number = 0;
  private lastTriggeredTime: Map<GestureType, number> = new Map();
  private recentPositions: { x: number; y: number; time: number }[] = [];

  constructor(config?: Partial<GestureEngineConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  public updateConfig(config: Partial<GestureEngineConfig>) {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): GestureEngineConfig {
    return this.config;
  }

  public classify(hand: HandLandmarkData, allHands: HandLandmarkData[] = []): RecognizedGesture {
    const now = performance.now();
    const lm = hand.landmarks;

    if (!lm || lm.length < 21) {
      return this.createGesture('NONE', 0, hand.handedness, { x: 0.5, y: 0.5 }, now);
    }

    // Update position history for swipe detection
    const palmCenter = {
      x: (lm[IDX.WRIST].x + lm[IDX.INDEX_MCP].x + lm[IDX.PINKY_MCP].x) / 3,
      y: (lm[IDX.WRIST].y + lm[IDX.INDEX_MCP].y + lm[IDX.PINKY_MCP].y) / 3,
    };
    this.recentPositions.push({ ...palmCenter, time: now });
    // Keep last 300ms of history
    this.recentPositions = this.recentPositions.filter((p) => now - p.time <= 300);

    // Check two-hand frame first if 2 hands present
    if (allHands.length >= 2 && this.config.enabledGestures.TWO_HAND_FRAME) {
      const h1 = allHands[0].landmarks;
      const h2 = allHands[1].landmarks;
      if (h1 && h2 && h1.length === 21 && h2.length === 21) {
        const dIndexTips = this.dist2D(h1[IDX.INDEX_TIP], h2[IDX.INDEX_TIP]);
        const dThumbs = this.dist2D(h1[IDX.THUMB_TIP], h2[IDX.THUMB_TIP]);
        if (dIndexTips < 0.12 && dThumbs < 0.15) {
          return this.processGestureTransition('TWO_HAND_FRAME', 0.88, hand.handedness, palmCenter, now);
        }
      }
    }

    // Detect dynamic swipes
    const swipe = this.detectSwipe(now);
    if (swipe !== 'NONE' && this.config.enabledGestures[swipe]) {
      return this.processGestureTransition(swipe, 0.9, hand.handedness, palmCenter, now);
    }

    // Geometric feature analysis
    const isThumbExtended = this.isThumbOpen(lm, hand.handedness);
    const isIndexExtended = this.isFingerExtended(lm, IDX.INDEX_TIP, IDX.INDEX_DIP, IDX.INDEX_PIP, IDX.INDEX_MCP);
    const isMiddleExtended = this.isFingerExtended(lm, IDX.MIDDLE_TIP, IDX.MIDDLE_DIP, IDX.MIDDLE_PIP, IDX.MIDDLE_MCP);
    const isRingExtended = this.isFingerExtended(lm, IDX.RING_TIP, IDX.RING_DIP, IDX.RING_PIP, IDX.RING_MCP);
    const isPinkyExtended = this.isFingerExtended(lm, IDX.PINKY_TIP, IDX.PINKY_DIP, IDX.PINKY_PIP, IDX.PINKY_MCP);

    const pinchDist = this.dist2D(lm[IDX.THUMB_TIP], lm[IDX.INDEX_TIP]);
    const pinchMiddleDist = this.dist2D(lm[IDX.THUMB_TIP], lm[IDX.MIDDLE_TIP]);

    let detected: GestureType = 'NONE';
    let confidence = 0.85;

    // 1. CLOSED FIST (All fingers curled into palm)
    if (
      !isIndexExtended &&
      !isMiddleExtended &&
      !isRingExtended &&
      !isPinkyExtended &&
      !isThumbExtended &&
      this.config.enabledGestures.CLOSED_FIST
    ) {
      detected = 'CLOSED_FIST';
      confidence = 0.95;
    }
    // 2. PINCH (Thumb tip close to extended index tip)
    else if (pinchDist < this.config.pinchThreshold && isIndexExtended && this.config.enabledGestures.PINCH) {
      detected = 'PINCH';
      confidence = Math.max(0.7, 1.0 - (pinchDist / this.config.pinchThreshold) * 0.3);
    }
    // 3. PINCH MIDDLE
    else if (pinchMiddleDist < this.config.pinchThreshold && isMiddleExtended && this.config.enabledGestures.PINCH_MIDDLE) {
      detected = 'PINCH_MIDDLE';
      confidence = 0.85;
    }
    // 3. DRAWING POSE: Index extended, Middle/Ring/Pinky curled
    else if (
      isIndexExtended &&
      !isMiddleExtended &&
      !isRingExtended &&
      !isPinkyExtended &&
      this.config.enabledGestures.DRAWING_POSE
    ) {
      detected = 'DRAWING_POSE';
      confidence = 0.92;
    }
    // 4. INDEX POINT
    else if (
      isIndexExtended &&
      !isMiddleExtended &&
      !isRingExtended &&
      !isPinkyExtended &&
      !isThumbExtended &&
      this.config.enabledGestures.INDEX_POINT
    ) {
      detected = 'INDEX_POINT';
      confidence = 0.9;
    }
    // 5. OPEN PALM
    else if (
      isIndexExtended &&
      isMiddleExtended &&
      isRingExtended &&
      isPinkyExtended &&
      this.config.enabledGestures.OPEN_PALM
    ) {
      detected = 'OPEN_PALM';
      confidence = 0.95;
    }
    // 6. VICTORY / PEACE
    else if (
      isIndexExtended &&
      isMiddleExtended &&
      !isRingExtended &&
      !isPinkyExtended &&
      this.config.enabledGestures.VICTORY
    ) {
      detected = 'VICTORY';
      confidence = 0.9;
    }
    // 8. THUMBS UP
    else if (
      isThumbExtended &&
      !isIndexExtended &&
      !isMiddleExtended &&
      !isRingExtended &&
      !isPinkyExtended &&
      lm[IDX.THUMB_TIP].y < lm[IDX.THUMB_MCP].y - 0.05 &&
      this.config.enabledGestures.THUMBS_UP
    ) {
      detected = 'THUMBS_UP';
      confidence = 0.88;
    }

    // Pointer position: Use index fingertip for drawing/pointing, palm center for full hand gestures
    const activePos =
      detected === 'DRAWING_POSE' || detected === 'INDEX_POINT' || detected === 'PINCH'
        ? { x: lm[IDX.INDEX_TIP].x, y: lm[IDX.INDEX_TIP].y }
        : palmCenter;

    return this.processGestureTransition(detected, confidence, hand.handedness, activePos, now);
  }

  private processGestureTransition(
    type: GestureType,
    confidence: number,
    handedness: 'Left' | 'Right',
    position: { x: number; y: number },
    now: number
  ): RecognizedGesture {
    if (type !== this.activeGesture) {
      this.activeGesture = type;
      this.gestureStartTime = now;
    }

    const duration = now - this.gestureStartTime;
    return this.createGesture(type, confidence, handedness, position, now, duration);
  }

  private createGesture(
    type: GestureType,
    confidence: number,
    handedness: 'Left' | 'Right',
    position: { x: number; y: number },
    timestamp: number,
    duration: number = 0
  ): RecognizedGesture {
    return {
      type,
      confidence,
      handedness,
      position,
      timestamp,
      duration,
    };
  }

  // Check cooldown before dispatching discrete actions
  public canTriggerAction(gesture: GestureType, customCooldownMs?: number): boolean {
    const now = performance.now();
    const cooldown = customCooldownMs ?? this.config.cooldownMs;
    const lastTime = this.lastTriggeredTime.get(gesture) || 0;

    if (now - lastTime >= cooldown) {
      this.lastTriggeredTime.set(gesture, now);
      return true;
    }
    return false;
  }

  // --- Helper Geometry Functions ---

  private dist2D(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private isFingerExtended(
    lm: NormalizedLandmark[],
    tipIdx: number,
    _dipIdx: number,
    pipIdx: number,
    mcpIdx: number
  ): boolean {
    const wrist = lm[IDX.WRIST];
    const tipDist = this.dist2D(lm[tipIdx], wrist);
    const pipDist = this.dist2D(lm[pipIdx], wrist);
    const mcpDist = this.dist2D(lm[mcpIdx], wrist);

    // Tip should be further from wrist than PIP and MCP
    return tipDist > pipDist * 1.15 && pipDist > mcpDist;
  }

  private isThumbOpen(lm: NormalizedLandmark[], _handedness: 'Left' | 'Right'): boolean {
    const thumbTip = lm[IDX.THUMB_TIP];
    const indexMcp = lm[IDX.INDEX_MCP];
    const wrist = lm[IDX.WRIST];

    // Distance from thumb tip to index MCP
    const distToMCP = this.dist2D(thumbTip, indexMcp);
    return distToMCP > 0.08 && this.dist2D(thumbTip, wrist) > this.dist2D(lm[IDX.THUMB_IP], wrist);
  }

  private detectSwipe(_now: number): GestureType {
    if (this.recentPositions.length < 5) return 'NONE';

    const oldest = this.recentPositions[0];
    const newest = this.recentPositions[this.recentPositions.length - 1];
    const dt = (newest.time - oldest.time) / 1000; // seconds

    if (dt < 0.08 || dt > 0.35) return 'NONE';

    const dx = newest.x - oldest.x;
    const dy = newest.y - oldest.y;
    const vx = Math.abs(dx) / dt;
    const vy = Math.abs(dy) / dt;

    if (vx > this.config.swipeVelocityThreshold && vx > vy * 1.5) {
      this.recentPositions = []; // Clear after detecting swipe
      return dx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
    }

    if (vy > this.config.swipeVelocityThreshold && vy > vx * 1.5) {
      this.recentPositions = [];
      return dy > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP';
    }

    return 'NONE';
  }
}

export const gestureEngine = new GestureRecognitionEngine();
