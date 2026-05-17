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

export function CircularSpectrum({ audio, settings }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const barsRef = useRef<THREE.Mesh[]>([]);
  const innerBarsRef = useRef<THREE.Mesh[]>([]);

  const BAR_COUNT = 128;
  const RADIUS = 4;
  const INNER_RADIUS = 2;

  const barGeometries = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, () =>
      new THREE.BoxGeometry(0.08, 1, 0.08)
    );
  }, []);

  const barMaterials = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const t = i / BAR_COUNT;
      const color = new THREE.Color();
      color.setHSL((t * 0.7 + 0.5) % 1.0, 1.0, 0.6);
      return new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    });
  }, []);

  const innerMaterials = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const t = (i / BAR_COUNT + 0.5) % 1.0;
      const color = new THREE.Color();
      color.setHSL(t * 0.7, 1.0, 0.5);
      return new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const data = audio.getAnalysisData();
    const freqData = data.frequencyData;
    const t = state.clock.elapsedTime;

    const step = Math.floor(freqData.length / BAR_COUNT);

    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2;
      const freqIdx = i * step;
      const rawVal = (freqData[freqIdx] || 0) / 255;
      const val = rawVal * settings.sensitivity;

      // Outer bars
      const bar = barsRef.current[i];
      if (bar) {
        const height = Math.max(0.05, val * 6 + 0.1);
        bar.scale.y = height;
        const x = Math.cos(angle) * RADIUS;
        const z = Math.sin(angle) * RADIUS;
        bar.position.set(x + Math.cos(angle) * height * 0.5, 0, z + Math.sin(angle) * height * 0.5);
        bar.rotation.y = -angle;
        bar.rotation.z = Math.PI / 2;

        // Color pulse on beat
        if (data.beat) {
          (bar.material as THREE.MeshBasicMaterial).opacity = 1.0;
        } else {
          (bar.material as THREE.MeshBasicMaterial).opacity = 0.6 + rawVal * 0.4;
        }
      }

      // Inner bars (mirrored)
      const innerBar = innerBarsRef.current[i];
      if (innerBar) {
        const height = Math.max(0.05, val * 3 + 0.05);
        innerBar.scale.y = height;
        const x = Math.cos(angle) * INNER_RADIUS;
        const z = Math.sin(angle) * INNER_RADIUS;
        innerBar.position.set(
          x - Math.cos(angle) * height * 0.5,
          0,
          z - Math.sin(angle) * height * 0.5
        );
        innerBar.rotation.y = -angle;
        innerBar.rotation.z = Math.PI / 2;
      }
    }

    // Rotate group
    groupRef.current.rotation.y = t * 0.12 + data.energy * 0.1;

    if (settings.cameraAutoRotate) {
      const camAngle = t * 0.06;
      state.camera.position.set(
        Math.cos(camAngle) * 10,
        5 + data.bass * 2,
        Math.sin(camAngle) * 10
      );
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer spectrum bars */}
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const angle = (i / BAR_COUNT) * Math.PI * 2;
        const x = Math.cos(angle) * RADIUS;
        const z = Math.sin(angle) * RADIUS;
        return (
          <mesh
            key={`outer-${i}`}
            ref={(m) => { if (m) barsRef.current[i] = m; }}
            geometry={barGeometries[i]}
            material={barMaterials[i]}
            position={[x, 0, z]}
          />
        );
      })}

      {/* Inner bars */}
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const angle = (i / BAR_COUNT) * Math.PI * 2;
        const x = Math.cos(angle) * INNER_RADIUS;
        const z = Math.sin(angle) * INNER_RADIUS;
        return (
          <mesh
            key={`inner-${i}`}
            ref={(m) => { if (m) innerBarsRef.current[i] = m; }}
            geometry={barGeometries[i]}
            material={innerMaterials[i]}
            position={[x, 0, z]}
          />
        );
      })}

      {/* Center orb */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RADIUS, 0.01, 8, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[INNER_RADIUS, 0.01, 8, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
