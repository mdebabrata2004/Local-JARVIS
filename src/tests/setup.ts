import '@testing-library/jest-dom';

// Mock Web Audio Context
class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
      start: () => {},
      stop: () => {},
      disconnect: () => {},
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }
  createAnalyser() {
    return {
      fftSize: 32,
      frequencyBinCount: 16,
      getByteFrequencyData: (arr: Uint8Array) => arr.fill(100),
      connect: () => {},
    };
  }
  resume() {
    return Promise.resolve();
  }
}

(window as any).AudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock SpeechSynthesis
(window as any).speechSynthesis = {
  speak: () => {},
  cancel: () => {},
  getVoices: () => [],
};

// Mock HTMLCanvasElement 2D context
const mockCtx = {
  clearRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  strokeRect: () => {},
  fillRect: () => {},
  quadraticCurveTo: () => {},
  save: () => {},
  restore: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  drawImage: () => {},
};

HTMLCanvasElement.prototype.getContext = function (contextType: string) {
  if (contextType === '2d') {
    return mockCtx as any;
  }
  return null;
} as any;

HTMLCanvasElement.prototype.toDataURL = function () {
  return 'data:image/png;base64,mock';
};
