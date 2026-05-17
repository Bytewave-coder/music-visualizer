'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { VisualizerSettings } from '@/types';

interface Props {
  audio: AudioAnalyzer;
  settings: VisualizerSettings;
}

const TERRAIN_VERT = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uEnergy;
  uniform float uSensitivity;
  uniform sampler2D uFreqTexture;

  varying vec3 vColor;
  varying float vElevation;

  void main() {
    vec3 pos = position;

    // Sample frequency texture for this position
    float tx = (pos.x / 20.0 + 0.5);
    float freqVal = texture2D(uFreqTexture, vec2(tx, 0.5)).r;

    // Wave layers
    float wave1 = sin(pos.x * 0.5 + uTime * 1.5) * cos(pos.z * 0.5 + uTime) * uBass * uSensitivity * 2.0;
    float wave2 = sin(pos.x * 1.2 - uTime * 2.0 + pos.z * 0.8) * uMid * uSensitivity;
    float wave3 = cos(pos.x * 2.0 + pos.z * 2.0 + uTime * 3.0) * uTreble * uSensitivity * 0.5;
    float freqWave = freqVal * uSensitivity * 4.0;

    pos.y = wave1 + wave2 + wave3 + freqWave;
    vElevation = pos.y;

    // Color by elevation
    float t = (pos.y + 3.0) / 6.0;
    t = clamp(t, 0.0, 1.0);
    
    vec3 deepBlue = vec3(0.0, 0.05, 0.4);
    vec3 cyan = vec3(0.0, 0.9, 1.0);
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 gold = vec3(1.0, 0.85, 0.0);

    if (t < 0.4) {
      vColor = mix(deepBlue, cyan, t / 0.4);
    } else if (t < 0.7) {
      vColor = mix(cyan, white, (t - 0.4) / 0.3);
    } else {
      vColor = mix(white, gold, (t - 0.7) / 0.3);
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const TERRAIN_FRAG = `
  varying vec3 vColor;
  varying float vElevation;

  void main() {
    float brightness = 0.5 + vElevation * 0.2;
    gl_FragColor = vec4(vColor * brightness, 1.0);
  }
`;

export function AudioWaveTerrain({ audio, settings }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const freqTextureRef = useRef<THREE.DataTexture>(null!);

  const { geometry, material, wireframeMat, freqTexture } = useMemo(() => {
    const GRID = 80;
    const SIZE = 22;
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, GRID, GRID);
    geo.rotateX(-Math.PI / 2);

    const freqData = new Uint8Array(256 * 4);
    const tex = new THREE.DataTexture(freqData, 256, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;

    const mat = new THREE.ShaderMaterial({
      vertexShader: TERRAIN_VERT,
      fragmentShader: TERRAIN_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uEnergy: { value: 0 },
        uSensitivity: { value: 1.2 },
        uFreqTexture: { value: tex },
      },
      side: THREE.DoubleSide,
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: '#00f5ff',
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });

    return { geometry: geo, material: mat, wireframeMat: wireMat, freqTexture: tex };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const data = audio.getAnalysisData();
    const t = state.clock.elapsedTime;

    // Update frequency texture
    const freqData = data.frequencyData;
    const texData = freqTexture.image.data as Uint8Array;
    for (let i = 0; i < 256; i++) {
      const val = freqData[Math.floor(i * freqData.length / 256)] || 0;
      texData[i * 4] = val;
      texData[i * 4 + 1] = val;
      texData[i * 4 + 2] = val;
      texData[i * 4 + 3] = 255;
    }
    freqTexture.needsUpdate = true;

    material.uniforms.uTime.value = t;
    material.uniforms.uBass.value = data.bass;
    material.uniforms.uMid.value = data.mid;
    material.uniforms.uTreble.value = data.treble;
    material.uniforms.uEnergy.value = data.energy;
    material.uniforms.uSensitivity.value = settings.sensitivity;

    if (settings.cameraAutoRotate) {
      const angle = t * 0.07;
      state.camera.position.set(
        Math.cos(angle) * 14,
        6 + data.bass * 3,
        Math.sin(angle) * 14
      );
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} material={material} />
      <mesh ref={wireRef} geometry={geometry} material={wireframeMat} />

      {/* Horizon fog plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#000510" />
      </mesh>
    </group>
  );
}
