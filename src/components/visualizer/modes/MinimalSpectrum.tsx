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

export function MinimalSpectrum({ audio, settings }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const barRefs = useRef<THREE.Mesh[]>([]);
  const mirrorRefs = useRef<THREE.Mesh[]>([]);

  const BAR_COUNT = 64;
  const BAR_WIDTH = 0.12;
  const BAR_GAP = 0.04;
  const TOTAL_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP);

  const { barGeo, materials, mirrorMats } = useMemo(() => {
    const geo = new THREE.BoxGeometry(BAR_WIDTH, 1, 0.1);
    const mats: THREE.MeshBasicMaterial[] = [];
    const mirrorMats: THREE.MeshBasicMaterial[] = [];

    for (let i = 0; i < BAR_COUNT; i++) {
      const t = i / BAR_COUNT;
      const hue = 0.55 + t * 0.45;
      const color = new THREE.Color().setHSL(hue % 1.0, 1.0, 0.55);
      mats.push(new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      mirrorMats.push(new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
    }

    return { barGeo: geo, materials: mats, mirrorMats };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const data = audio.getAnalysisData();
    const freqData = data.frequencyData;
    const t = state.clock.elapsedTime;

    const step = Math.floor(freqData.length * 0.5 / BAR_COUNT);

    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = barRefs.current[i];
      const mirror = mirrorRefs.current[i];
      if (!bar || !mirror) continue;

      const freqVal = (freqData[i * step + 2] || 0) / 255;
      const height = Math.max(0.02, freqVal * settings.sensitivity * 8 + 0.02);

      const x = (i - BAR_COUNT / 2) * (BAR_WIDTH + BAR_GAP);

      bar.scale.y = height;
      bar.position.set(x, height / 2, 0);

      mirror.scale.y = height;
      mirror.position.set(x, -height / 2, 0);

      // Beat flash
      if (data.beat && i % 4 === 0) {
        (bar.material as THREE.MeshBasicMaterial).opacity = 1.0;
      } else {
        (bar.material as THREE.MeshBasicMaterial).opacity = 0.7 + freqVal * 0.3;
      }
    }

    groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.1;

    if (settings.cameraAutoRotate) {
      state.camera.position.set(0, 1, 16 - data.energy * 3);
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main bars */}
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const x = (i - BAR_COUNT / 2) * (BAR_WIDTH + BAR_GAP);
        return (
          <mesh
            key={`bar-${i}`}
            ref={(m) => { if (m) barRefs.current[i] = m; }}
            geometry={barGeo}
            material={materials[i]}
            position={[x, 0.5, 0]}
          />
        );
      })}

      {/* Mirror bars */}
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const x = (i - BAR_COUNT / 2) * (BAR_WIDTH + BAR_GAP);
        return (
          <mesh
            key={`mirror-${i}`}
            ref={(m) => { if (m) mirrorRefs.current[i] = m; }}
            geometry={barGeo}
            material={mirrorMats[i]}
            position={[x, -0.5, 0]}
            scale={[1, 1, 1]}
          />
        );
      })}

      {/* Center line */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[TOTAL_WIDTH, 0.005, 0.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>

      {/* Side accent lines */}
      <mesh position={[-TOTAL_WIDTH / 2 - 0.2, 0, 0]}>
        <boxGeometry args={[0.02, 12, 0.05]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.3} />
      </mesh>
      <mesh position={[TOTAL_WIDTH / 2 + 0.2, 0, 0]}>
        <boxGeometry args={[0.02, 12, 0.05]} />
        <meshBasicMaterial color="#9b00ff" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
