export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  coverUrl?: string;
  file?: File;
}

export type VisualizerMode =
  | 'galaxy'
  | 'particles'
  | 'neonTunnel'
  | 'waveTerrain'
  | 'blackHole'
  | 'circularSpectrum'
  | 'liquidWaves'
  | 'spaceWarp'
  | 'floatingCubes'
  | 'minimalSpectrum';

export interface VisualizerModeInfo {
  id: VisualizerMode;
  label: string;
  icon: string;
  description: string;
}

export type Theme =
  | 'cosmic'
  | 'cyberpunk'
  | 'anime'
  | 'amoled'
  | 'space'
  | 'retro'
  | 'monochrome';

export interface ThemeInfo {
  id: Theme;
  label: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  energy: number;
  bpm: number;
  beat: boolean;
}

export interface VisualizerSettings {
  mode: VisualizerMode;
  theme: Theme;
  sensitivity: number;
  particleIntensity: number;
  glowIntensity: number;
  colorScheme: string[];
  bloomStrength: number;
  showGrid: boolean;
  cameraAutoRotate: boolean;
  fxaaEnabled: boolean;
}

export interface PlayerState {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  isFullscreen: boolean;
  showPlaylist: boolean;
  showCustomization: boolean;
}

export const VISUALIZER_MODES: VisualizerModeInfo[] = [
  { id: 'galaxy', label: 'Galaxy', icon: '🌌', description: 'Spiral galaxy reacts to beats' },
  { id: 'particles', label: 'Particles', icon: '⚝', description: 'Floating particle constellation' },
  { id: 'neonTunnel', label: 'Neon Tunnel', icon: '🔮', description: 'Infinite neon corridor' },
  { id: 'waveTerrain', label: 'Wave Terrain', icon: '༄ ', description: 'Audio frequency landscape' },
  { id: 'blackHole', label: 'Black Hole', icon: '﴾⦵﴿', description: 'Gravitational energy vortex' },
  { id: 'circularSpectrum', label: 'Circular Spectrum', icon: '⍥⃝𓂂', description: 'Radial frequency spectrum' },
  { id: 'liquidWaves', label: 'Liquid Waves', icon: '﹌', description: 'Fluid energy simulation' },
  { id: 'spaceWarp', label: 'Space Warp', icon: '𖠰', description: 'Hyperspace star tunnel' },
  { id: 'floatingCubes', label: 'Floating Cubes', icon: '☃︎', description: 'Reactive geometry grid' },
  { id: 'minimalSpectrum', label: 'Minimal Spectrum', icon: '📊', description: 'Clean frequency bars' },
];

export const THEMES: ThemeInfo[] = [
  { id: 'cosmic', label: 'Cosmic', primaryColor: '#00f5ff', secondaryColor: '#9b00ff' },
  { id: 'cyberpunk', label: 'Cyberpunk', primaryColor: '#00ff41', secondaryColor: '#ff003c' },
  { id: 'anime', label: 'Anime', primaryColor: '#ff6eb4', secondaryColor: '#7c3aed' },
  { id: 'amoled', label: 'AMOLED', primaryColor: '#ffffff', secondaryColor: '#555555' },
  { id: 'space', label: 'Space', primaryColor: '#4fc3f7', secondaryColor: '#ab47bc' },
  { id: 'retro', label: 'Retro Futuristic', primaryColor: '#ff6b35', secondaryColor: '#f7c59f' },
  { id: 'monochrome', label: 'Monochrome', primaryColor: '#ffffff', secondaryColor: '#666666' },
];
