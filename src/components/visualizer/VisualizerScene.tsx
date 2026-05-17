'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { AudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { VisualizerMode, VisualizerSettings } from '@/types';

import { GalaxyVisualizer } from './modes/GalaxyVisualizer';
import { NeonTunnel } from './modes/NeonTunnel';
import { BlackHole } from './modes/BlackHole';
import { CircularSpectrum } from './modes/CircularSpectrum';
import { ParticleSystem } from './modes/ParticleSystem';
import { AudioWaveTerrain } from './modes/AudioWaveTerrain';
import { SpaceWarp } from './modes/SpaceWarp';
import { FloatingCubes } from './modes/FloatingCubes';
import { LiquidWaves } from './modes/LiquidWaves';
import { MinimalSpectrum } from './modes/MinimalSpectrum';

interface Props {
  audio: AudioAnalyzer;
  mode: VisualizerMode;
  settings: VisualizerSettings;
}

function VisualizerContent({ audio, mode, settings }: Props) {
  const props = { audio, settings };

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#00f5ff" />

      {mode === 'galaxy' && <GalaxyVisualizer {...props} />}
      {mode === 'particles' && <ParticleSystem {...props} />}
      {mode === 'neonTunnel' && <NeonTunnel {...props} />}
      {mode === 'waveTerrain' && <AudioWaveTerrain {...props} />}
      {mode === 'blackHole' && <BlackHole {...props} />}
      {mode === 'circularSpectrum' && <CircularSpectrum {...props} />}
      {mode === 'liquidWaves' && <LiquidWaves {...props} />}
      {mode === 'spaceWarp' && <SpaceWarp {...props} />}
      {mode === 'floatingCubes' && <FloatingCubes {...props} />}
      {mode === 'minimalSpectrum' && <MinimalSpectrum {...props} />}

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={settings.bloomStrength}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          blendFunction={BlendFunction.ADD}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0005, 0.0005)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </>
  );
}

export function VisualizerScene({ audio, mode, settings }: Props) {
  return (
    <Canvas
      className="visualizer-canvas"
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      camera={{
        fov: 60,
        near: 0.1,
        far: 500,
        position: [0, 5, 12],
      }}
    >
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#050510', 30, 100]} />

      <Suspense fallback={null}>
        <VisualizerContent audio={audio} mode={mode} settings={settings} />
      </Suspense>
    </Canvas>
  );
}
