'use client';

import { useRef, useCallback, useEffect } from 'react';
import { AudioAnalysisData } from '@/types';

const FFT_SIZE = 2048;
const SMOOTHING = 0.8;

export interface AudioAnalyzer {
  audioRef: React.RefObject<HTMLAudioElement>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  dataArrayRef: React.RefObject<Uint8Array>;
  timeDataArrayRef: React.RefObject<Uint8Array>;
  audioContextRef: React.RefObject<AudioContext | null>;
  isInitialized: React.RefObject<boolean>;
  initAudio: () => Promise<void>;
  connectSource: (url: string) => void;
  getAnalysisData: () => AudioAnalysisData;
  cleanup: () => void;
}

export function useAudioAnalyzer(): AudioAnalyzer {
  const audioRef = useRef<HTMLAudioElement>(null!);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(FFT_SIZE / 2));
  const timeDataArrayRef = useRef<Uint8Array>(new Uint8Array(FFT_SIZE / 2));
  const isInitialized = useRef(false);

  // BPM detection state
  const bpmBufferRef = useRef<number[]>([]);
  const lastBeatRef = useRef<number>(0);
  const prevEnergyRef = useRef<number>(0);
  const currentBpmRef = useRef<number>(120);

  const initAudio = useCallback(async () => {
    if (isInitialized.current) {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return;
    }

    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      const ctx = new AudioContext({ sampleRate: 44100 });
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyserRef.current = analyser;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      if (audioRef.current && !sourceNodeRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;
        source.connect(analyser);
        analyser.connect(ctx.destination);
      }

      isInitialized.current = true;
    } catch (err) {
      console.error('Audio initialization failed:', err);
    }
  }, []);

  const connectSource = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
    }
  }, []);

  const getAnalysisData = useCallback((): AudioAnalysisData => {
    const analyser = analyserRef.current;
    const freqData = dataArrayRef.current;
    const timeData = timeDataArrayRef.current;

    if (!analyser) {
      return {
        frequencyData: freqData,
        timeData,
        bass: 0,
        mid: 0,
        treble: 0,
        energy: 0,
        bpm: 120,
        beat: false,
      };
    }

    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);

    const bufferLength = freqData.length;

    // Frequency band analysis (logarithmic bands for natural sound perception)
    const bassEnd = Math.floor(bufferLength * 0.05);   // 0-5%: bass (~20-200Hz)
    const midEnd = Math.floor(bufferLength * 0.30);    // 5-30%: mid (~200-2kHz)
    // treble: 30-100%: treble (~2k-22kHz)

    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += freqData[i];
    const bass = (bassSum / bassEnd / 255) * 2.0;

    let midSum = 0;
    for (let i = bassEnd; i < midEnd; i++) midSum += freqData[i];
    const mid = midSum / (midEnd - bassEnd) / 255;

    let trebleSum = 0;
    for (let i = midEnd; i < bufferLength; i++) trebleSum += freqData[i];
    const treble = trebleSum / (bufferLength - midEnd) / 255;

    const energy = (bass * 0.5 + mid * 0.3 + treble * 0.2);

    // Simple beat detection via energy threshold
    const now = performance.now();
    let beat = false;
    if (energy > prevEnergyRef.current * 1.3 && energy > 0.15 && now - lastBeatRef.current > 200) {
      beat = true;
      const elapsed = now - lastBeatRef.current;
      if (elapsed < 2000 && elapsed > 200) {
        const bpm = 60000 / elapsed;
        bpmBufferRef.current.push(bpm);
        if (bpmBufferRef.current.length > 8) bpmBufferRef.current.shift();
        const avgBpm = bpmBufferRef.current.reduce((a, b) => a + b, 0) / bpmBufferRef.current.length;
        currentBpmRef.current = Math.round(avgBpm);
      }
      lastBeatRef.current = now;
    }
    prevEnergyRef.current = energy;

    return {
      frequencyData: freqData,
      timeData,
      bass: Math.min(bass, 1),
      mid: Math.min(mid, 1),
      treble: Math.min(treble, 1),
      energy: Math.min(energy, 1),
      bpm: currentBpmRef.current,
      beat,
    };
  }, []);

  const cleanup = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch {}
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
    }
    isInitialized.current = false;
    sourceNodeRef.current = null;
    analyserRef.current = null;
    audioContextRef.current = null;
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    audioRef,
    analyserRef,
    dataArrayRef,
    timeDataArrayRef,
    audioContextRef,
    isInitialized,
    initAudio,
    connectSource,
    getAnalysisData,
    cleanup,
  };
}
