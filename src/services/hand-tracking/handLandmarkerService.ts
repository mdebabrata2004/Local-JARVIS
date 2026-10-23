import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarkData, NormalizedLandmark, TrackingFrame } from '@/types';

export class HandLandmarkerService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;
  private initError: string | null = null;
  private lastVideoTime: number = -1;
  private smoothedHands: Map<string, NormalizedLandmark[]> = new Map();
  private simulationActive: boolean = false;
  private simulatedPos: { x: number; y: number } = { x: 0.5, y: 0.5 };
  private simulatedGesture: 'NONE' | 'DRAWING_POSE' | 'OPEN_PALM' | 'CLOSED_FIST' | 'PINCH' = 'NONE';

  public async initialize(options?: {
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    numHands?: number;
  }): Promise<void> {
    if (this.handLandmarker) return;
    if (this.isInitializing) return;

    this.isInitializing = true;
    this.initError = null;

    try {
      // 100% offline local WASM files bundled in /wasm
      const vision = await FilesetResolver.forVisionTasks('/wasm');

      // Local offline model asset in /models/hand_landmarker.task
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: options?.numHands || 2,
        minHandDetectionConfidence: options?.minDetectionConfidence || 0.5,
        minHandPresenceConfidence: options?.minTrackingConfidence || 0.5,
        minTrackingConfidence: options?.minTrackingConfidence || 0.5,
      });
      console.log('MediaPipe Hand Landmarker initialized locally via GPU/WASM.');
    } catch (err: any) {
      console.warn('GPU delegate failed or WebGL unavailable, falling back to CPU delegate:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks('/wasm');
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: options?.numHands || 2,
          minHandDetectionConfidence: options?.minDetectionConfidence || 0.5,
          minHandPresenceConfidence: options?.minTrackingConfidence || 0.5,
          minTrackingConfidence: options?.minTrackingConfidence || 0.5,
        });
        console.log('MediaPipe Hand Landmarker initialized locally via CPU/WASM.');
      } catch (cpuErr: any) {
        this.initError = `Failed to initialize MediaPipe Hand Landmarker: ${cpuErr.message || cpuErr}`;
        console.error(this.initError);
        throw new Error(this.initError);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  public detect(video: HTMLVideoElement, smoothingAlpha: number = 0.6): TrackingFrame {
    const timestamp = performance.now();
    const frame: TrackingFrame = {
      hands: [],
      timestamp,
      fps: 0,
    };

    if (this.simulationActive) {
      frame.hands = [this.generateSimulatedHand(this.simulatedPos.x, this.simulatedPos.y, this.simulatedGesture)];
      return frame;
    }

    if (!this.handLandmarker || video.readyState < 2) {
      return frame;
    }

    if (video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime;
      try {
        const results = this.handLandmarker.detectForVideo(video, timestamp);

        if (results && results.landmarks && results.landmarks.length > 0) {
          frame.hands = results.landmarks.map((landmarks, index) => {
            const handedness = (results.handednesses?.[index]?.[0]?.categoryName as 'Left' | 'Right') || 'Right';
            const confidence = results.handednesses?.[index]?.[0]?.score || 0.85;

            // Apply exponential moving average (EMA) smoothing
            const key = `${handedness}-${index}`;
            const smoothed = this.smoothLandmarks(key, landmarks, smoothingAlpha);

            return {
              landmarks: smoothed,
              worldLandmarks: results.worldLandmarks?.[index] || smoothed,
              handedness,
              confidence,
            };
          });
        } else {
          // Clear smoothed hands cache when tracking lost
          this.smoothedHands.clear();
        }
      } catch (e) {
        console.warn('Detection frame skipped:', e);
      }
    }

    return frame;
  }

  private smoothLandmarks(
    key: string,
    current: NormalizedLandmark[],
    alpha: number
  ): NormalizedLandmark[] {
    const previous = this.smoothedHands.get(key);
    if (!previous || previous.length !== current.length) {
      this.smoothedHands.set(key, current);
      return current;
    }

    // EMA: smoothed = alpha * current + (1 - alpha) * previous
    const smoothed: NormalizedLandmark[] = current.map((curr, i) => {
      const prev = previous[i];
      return {
        x: alpha * curr.x + (1 - alpha) * prev.x,
        y: alpha * curr.y + (1 - alpha) * prev.y,
        z: alpha * curr.z + (1 - alpha) * prev.z,
        visibility: curr.visibility,
      };
    });

    this.smoothedHands.set(key, smoothed);
    return smoothed;
  }

  // --- Hand Simulation for Test / No-Camera Mode ---
  public setSimulation(active: boolean, x: number = 0.5, y: number = 0.5, gesture: any = 'NONE') {
    this.simulationActive = active;
    this.simulatedPos = { x, y };
    this.simulatedGesture = gesture;
  }

  public isSimulating(): boolean {
    return this.simulationActive;
  }

  public generateSimulatedHand(
    x: number,
    y: number,
    gesture: 'NONE' | 'DRAWING_POSE' | 'OPEN_PALM' | 'CLOSED_FIST' | 'PINCH'
  ): HandLandmarkData {
    // Generate synthetic 21 landmarks centered around (x, y)
    const landmarks: NormalizedLandmark[] = [];
    const isPen = gesture === 'DRAWING_POSE';
    const isPalm = gesture === 'OPEN_PALM';
    const isFist = gesture === 'CLOSED_FIST';
    const isPinch = gesture === 'PINCH';

    // Wrist
    landmarks.push({ x, y: y + 0.15, z: 0 });

    // Thumb (1..4)
    const thumbCurl = isFist ? 0.04 : 0.08;
    landmarks.push({ x: x - 0.03, y: y + 0.10, z: 0 });
    landmarks.push({ x: x - 0.05, y: y + 0.06, z: 0 });
    landmarks.push({ x: x - 0.06, y: y + 0.03, z: 0 });
    // Thumb tip: if pinch, move close to index tip
    landmarks.push({
      x: isPinch ? x : x - thumbCurl,
      y: isPinch ? y - 0.08 : y,
      z: 0,
    });

    // Index (5..8)
    const indexExtended = isPen || isPalm || isPinch;
    landmarks.push({ x: x - 0.02, y: y + 0.05, z: 0 });
    landmarks.push({ x: x - 0.02, y: y + 0.01, z: 0 });
    landmarks.push({ x: x - 0.01, y: y - 0.04, z: 0 });
    landmarks.push({
      x,
      y: indexExtended ? y - 0.09 : y + 0.02,
      z: 0,
    });

    // Middle (9..12)
    const middleExtended = isPalm;
    landmarks.push({ x: x, y: y + 0.05, z: 0 });
    landmarks.push({ x: x, y: y + 0.01, z: 0 });
    landmarks.push({ x: x, y: y - 0.04, z: 0 });
    landmarks.push({
      x: x + 0.01,
      y: middleExtended ? y - 0.10 : y + 0.03,
      z: 0,
    });

    // Ring (13..16)
    const ringExtended = isPalm;
    landmarks.push({ x: x + 0.02, y: y + 0.06, z: 0 });
    landmarks.push({ x: x + 0.02, y: y + 0.02, z: 0 });
    landmarks.push({ x: x + 0.02, y: y - 0.03, z: 0 });
    landmarks.push({
      x: x + 0.02,
      y: ringExtended ? y - 0.08 : y + 0.04,
      z: 0,
    });

    // Pinky (17..20)
    const pinkyExtended = isPalm;
    landmarks.push({ x: x + 0.04, y: y + 0.07, z: 0 });
    landmarks.push({ x: x + 0.04, y: y + 0.03, z: 0 });
    landmarks.push({ x: x + 0.04, y: y - 0.01, z: 0 });
    landmarks.push({
      x: x + 0.04,
      y: pinkyExtended ? y - 0.06 : y + 0.05,
      z: 0,
    });

    return {
      landmarks,
      handedness: 'Right',
      confidence: 0.95,
    };
  }

  public isReady(): boolean {
    return !!this.handLandmarker;
  }

  public getError(): string | null {
    return this.initError;
  }

  public dispose(): void {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch (e) {
        console.warn('Error closing hand landmarker:', e);
      }
      this.handLandmarker = null;
    }
    this.smoothedHands.clear();
  }
}

export const handLandmarkerService = new HandLandmarkerService();
