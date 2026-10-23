import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Upload,
  Music,
  Radio,
} from 'lucide-react';
import { RecognizedGesture } from '@/types';
import { soundService } from '@/services/sound/soundService';

interface MediaTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  isSynthesized?: boolean;
}

interface MediaCenterViewProps {
  gesture: RecognizedGesture | null;
}

export const MediaCenterView: React.FC<MediaCenterViewProps> = ({ gesture }) => {
  const [tracks, setTracks] = useState<MediaTrack[]>([
    {
      id: 'synth-1',
      name: 'JARVIS Holographic Ambience',
      artist: 'Internal Procedural Synthesizer',
      url: '',
      isSynthesized: true,
    },
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration] = useState<number>(180);

  // Advance time while playing
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((t) => (t >= duration ? 0 : t + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  // Initialize Web Audio Analyser for Visualizer
  const setupAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  };

  // Start / Stop Synthesizer Ambience
  const toggleSynthAmbience = (play: boolean) => {
    setupAudioContext();
    const ctx = audioCtxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    if (play) {
      if (!synthOscRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, ctx.currentTime); // Low A drone
        gain.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, ctx.currentTime);

        osc.connect(gain);
        gain.connect(analyser);
        analyser.connect(ctx.destination);
        osc.start();

        synthOscRef.current = osc;
        synthGainRef.current = gain;
      }
    } else {
      if (synthOscRef.current) {
        try {
          synthOscRef.current.stop();
          synthOscRef.current.disconnect();
        } catch {}
        synthOscRef.current = null;
        synthGainRef.current = null;
      }
    }
  };

  const handlePlayPause = () => {
    soundService.playClick();
    setupAudioContext();

    if (currentTrack?.isSynthesized) {
      const nextPlay = !isPlaying;
      setIsPlaying(nextPlay);
      toggleSynthAmbience(nextPlay);
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
      }
    }
  };

  const handleNext = () => {
    soundService.playClick();
    if (tracks.length > 1) {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
      setIsPlaying(false);
      toggleSynthAmbience(false);
    }
  };

  const handlePrev = () => {
    soundService.playClick();
    if (tracks.length > 1) {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
      setIsPlaying(false);
      toggleSynthAmbience(false);
    }
  };

  // File Upload handler for user's local audio files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: MediaTrack[] = Array.from(files).map((f) => ({
      id: `audio-${Date.now()}-${Math.random()}`,
      name: f.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local Audio File',
      url: URL.createObjectURL(f),
      isSynthesized: false,
    }));

    setTracks((prev) => [...prev, ...newTracks]);
    setCurrentTrackIndex(tracks.length);
    setIsPlaying(false);
    toggleSynthAmbience(false);
    soundService.playActionConfirm();
    e.target.value = '';
  };

  // Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const analyser = analyserRef.current;
      const bufferLength = analyser ? analyser.frequencyBinCount : 32;
      const dataArray = new Uint8Array(bufferLength);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Subtle idle ambient ripple
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = isPlaying ? 50 + Math.sin(Date.now() / 200 + i) * 30 : 10;
        }
      }

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Cyan-to-blue gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, 'rgba(0, 243, 255, 0.2)');
        gradient.addColorStop(1, '#00f3ff');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      toggleSynthAmbience(false);
    };
  }, [isPlaying]);

  // Gesture Controls for Media
  useEffect(() => {
    if (!gesture || gesture.type === 'NONE') return;

    if (gesture.type === 'SWIPE_RIGHT') {
      handleNext();
    } else if (gesture.type === 'SWIPE_LEFT') {
      handlePrev();
    } else if (gesture.type === 'OPEN_PALM' && gesture.duration > 400 && gesture.duration < 550) {
      handlePlayPause();
    }
  }, [gesture]);

  return (
    <div className="w-full h-full p-6 bg-slate-950 overflow-y-auto select-none space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            Local Media Center
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Browser HTML5 Audio & Web Audio Spectrum Visualizer • Zero Cloud Streaming
          </p>
        </div>

        <label className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/20 rounded-lg text-xs font-mono cursor-pointer transition">
          <Upload className="w-3.5 h-3.5" />
          <span>Add Local Audio Files</span>
          <input type="file" accept="audio/*" multiple onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Main Player Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualizer & Now Playing */}
        <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-cyan-500/20 rounded-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400/80 mb-1">
              <span>NOW PLAYING</span>
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                {currentTrack?.isSynthesized ? 'SYNTHESIZED AMBIENCE' : 'LOCAL AUDIO'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-wide truncate">
              {currentTrack?.name || 'No Track Selected'}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">{currentTrack?.artist || 'JARVIS System'}</p>
          </div>

          {/* Canvas Spectrum Visualizer */}
          <div className="w-full h-36 bg-slate-950/80 border border-cyan-500/30 rounded-xl overflow-hidden p-2 flex items-end">
            <canvas ref={canvasRef} width={500} height={140} className="w-full h-full" />
          </div>

          {/* Controls Bar */}
          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-cyan-500/20">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>00:00</span>
                <span>03:00</span>
              </div>
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  className="p-2 text-slate-400 hover:text-cyan-300 transition"
                  title="Previous Track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-hud-glow transition transform active:scale-95"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 text-slate-400 hover:text-cyan-300 transition"
                  title="Next Track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-slate-400 hover:text-cyan-300"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    setIsMuted(val === 0);
                    if (synthGainRef.current && audioCtxRef.current) {
                      synthGainRef.current.gain.setValueAtTime(val * 0.15, audioCtxRef.current.currentTime);
                    }
                  }}
                  className="w-24 accent-cyan-400"
                />
                <span className="w-8 text-right text-[11px] text-slate-400">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist & Gesture Guide */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-2xl flex-1 flex flex-col">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 mb-3 block">
              Playlist Queue ({tracks.length})
            </span>
            <div className="space-y-1.5 overflow-y-auto max-h-60 flex-1">
              {tracks.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(false);
                    toggleSynthAmbience(false);
                  }}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition border ${
                    currentTrackIndex === idx
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/30 border-transparent hover:border-cyan-500/20 text-slate-300'
                  }`}
                >
                  <div className="truncate max-w-[180px]">
                    <div className="font-semibold truncate">{t.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{t.artist}</div>
                  </div>
                  {currentTrackIndex === idx && isPlaying && (
                    <span className="text-[10px] font-mono text-cyan-400 animate-pulse">PLAYING</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gesture Shortcuts Info Card */}
          <div className="p-4 bg-slate-900/60 border border-cyan-500/20 rounded-2xl space-y-2 text-xs font-mono">
            <span className="text-cyan-300 font-bold uppercase tracking-wider block text-[11px]">
              Media Gesture Shortcuts
            </span>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>• <strong className="text-white">Swipe Right</strong>: Next track</li>
              <li>• <strong className="text-white">Swipe Left</strong>: Previous track</li>
              <li>• <strong className="text-white">Open Palm (Hold)</strong>: Play / Pause</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
