import { create } from 'zustand';
import { VisualizerMode, Theme, VisualizerSettings } from '@/types';

interface VisualizerStore extends VisualizerSettings {
  setMode: (mode: VisualizerMode) => void;
  setTheme: (theme: Theme) => void;
  setSensitivity: (sensitivity: number) => void;
  setParticleIntensity: (intensity: number) => void;
  setGlowIntensity: (glow: number) => void;
  setBloomStrength: (strength: number) => void;
  setColorScheme: (colors: string[]) => void;
  toggleGrid: () => void;
  toggleAutoRotate: () => void;
  toggleFXAA: () => void;
  applyPreset: (preset: string) => void;
}

const PRESETS: Record<string, Partial<VisualizerSettings>> = {
  default: {
    sensitivity: 1.2,
    particleIntensity: 0.7,
    glowIntensity: 1.0,
    bloomStrength: 1.5,
    colorScheme: ['#00f5ff', '#9b00ff', '#ff0080'],
  },
  intense: {
    sensitivity: 2.0,
    particleIntensity: 1.0,
    glowIntensity: 2.0,
    bloomStrength: 2.5,
    colorScheme: ['#ff0080', '#ff6b00', '#ffd700'],
  },
  calm: {
    sensitivity: 0.6,
    particleIntensity: 0.4,
    glowIntensity: 0.5,
    bloomStrength: 0.8,
    colorScheme: ['#4fc3f7', '#00e5ff', '#80deea'],
  },
  neon: {
    sensitivity: 1.5,
    particleIntensity: 0.9,
    glowIntensity: 2.0,
    bloomStrength: 2.0,
    colorScheme: ['#00ff41', '#ff003c', '#ffff00'],
  },
};

export const useVisualizerStore = create<VisualizerStore>((set) => ({
  mode: 'galaxy',
  theme: 'cosmic',
  sensitivity: 1.2,
  particleIntensity: 0.7,
  glowIntensity: 1.0,
  colorScheme: ['#00f5ff', '#9b00ff', '#ff0080'],
  bloomStrength: 1.5,
  showGrid: false,
  cameraAutoRotate: true,
  fxaaEnabled: true,

  setMode: (mode) => set({ mode }),
  setTheme: (theme) => set({ theme }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setParticleIntensity: (particleIntensity) => set({ particleIntensity }),
  setGlowIntensity: (glowIntensity) => set({ glowIntensity }),
  setBloomStrength: (bloomStrength) => set({ bloomStrength }),
  setColorScheme: (colorScheme) => set({ colorScheme }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleAutoRotate: () => set((s) => ({ cameraAutoRotate: !s.cameraAutoRotate })),
  toggleFXAA: () => set((s) => ({ fxaaEnabled: !s.fxaaEnabled })),
  applyPreset: (preset) => set((s) => ({ ...s, ...PRESETS[preset] })),
}));
