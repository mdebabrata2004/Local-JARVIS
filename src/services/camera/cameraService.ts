/**
 * Webcam Hardware Service
 * Handles getUserMedia stream management, resolution configuration,
 * device selection, and lifecycle cleanup.
 */

export class CameraService {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isRunning: boolean = false;

  public async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'videoinput');
    } catch (e) {
      console.warn('Failed to enumerate media devices:', e);
      return [];
    }
  }

  public async startCamera(
    deviceId?: string,
    resolution: '640x480' | '1280x720' | '1920x1080' = '1280x720'
  ): Promise<MediaStream> {
    this.stopCamera();

    const [width, height] = resolution.split('x').map(Number);

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: 30, max: 60 },
        ...(deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : {}),
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;
      this.isRunning = true;

      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('playsinline', 'true');
        this.videoElement.setAttribute('muted', 'true');
        this.videoElement.muted = true;
      }

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      return stream;
    } catch (error: any) {
      this.isRunning = false;
      this.mediaStream = null;
      throw new Error(
        error.name === 'NotAllowedError'
          ? 'Camera permission denied by user or system policy.'
          : error.name === 'NotFoundError'
          ? 'No compatible video camera hardware was found on this system.'
          : `Camera initialization error: ${error.message || error.name}`
      );
    }
  }

  public stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isRunning = false;
  }

  public getStream(): MediaStream | null {
    return this.mediaStream;
  }

  public getVideo(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public isActive(): boolean {
    return this.isRunning && !!this.mediaStream && this.mediaStream.active;
  }
}

export const cameraService = new CameraService();
