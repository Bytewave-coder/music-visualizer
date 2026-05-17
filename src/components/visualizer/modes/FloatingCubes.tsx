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

export function FloatingCubes({ audio, settings }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const cubeRefs = useRef<THREE.Mesh[]>([]);

  const GRID_X = 10;
  const GRID_Y = 6;
  const TOTAL = GRID_X * GRID_Y;

  const { cubeGeo, cubeEdgesGeo, cubeMaterials, edgeMaterials, cubeData } = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const edgesGeo = new THREE.EdgesGeometry(geo);

    const materials: THREE.MeshBasicMaterial[] = [];
    const edgeMats: THREE.LineBasicMaterial[] = [];
    const data: { baseX: number; baseY: number; freqIdx: number; phase: number }[] = [];

    for (let gy = 0; gy < GRID_Y; gy++) {
      for (let gx = 0; gx < GRID_X; gx++) {
        const i = gy * GRID_X + gx;
        const t = i / TOTAL;
        const hue = (t * 0.7 + 0.5) % 1.0;
        const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
        
        materials.push(new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }));

        edgeMats.push(new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
        }));

        const baseX = (gx - GRID_X / 2 + 0.5) * 1.2;
        const baseY = (gy - GRID_Y / 2 + 0.5) * 1.2;
        const freqIdx = Math.floor((t) * 100);
        const phase = Math.random() * Math.PI * 2;

        data.push({ baseX, baseY, freqIdx, phase });
      }
    }

    return { cubeGeo: geo, cubeEdgesGeo: edgesGeo, cubeMaterials: materials, edgeMaterials: edgeMats, cubeData: data };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const data = audio.getAnalysisData();
    const freqData = data.frequencyData;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < TOTAL; i++) {
      const cube = cubeRefs.current[i];
      if (!cube) continue;

      const d = cubeData[i];
      const freqVal = (freqData[d.freqIdx] || 0) / 255;
      const val = freqVal * settings.sensitivity;

      // Scale with frequency
      const scale = 0.3 + val * 2.5 + data.energy * 0.3;
      cube.scale.set(scale, scale, scale);

      // Floating position
      const floatY = Math.sin(t * 0.8 + d.phase) * 0.3 * (1 + val * 2);
      cube.position.set(d.baseX, d.baseY + floatY, 0);

      // Rotation
      cube.rotation.x = t * 0.3 + d.phase;
      cube.rotation.y = t * 0.5 + d.phase * 1.3;
      cube.rotation.z = t * 0.2 + d.phase * 0.7;

      // Opacity
      (cube.children[0] as THREE.Mesh).material &&
        ((cube.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity !== undefined &&
        (((cube.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.2 + val * 0.6);
    }

    groupRef.current.rotation.y = t * 0.05;

    if (settings.cameraAutoRotate) {
      const cAngle = t * 0.07;
      state.camera.position.set(
        Math.cos(cAngle) * 14,
        Math.sin(t * 0.1) * 4 + 1,
        Math.sin(cAngle) * 14
      );
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {cubeData.map((d, i) => (
        <group
          key={i}
          ref={(m) => { if (m) cubeRefs.current[i] = m as unknown as THREE.Mesh; }}
          position={[d.baseX, d.baseY, 0]}
        >
          <mesh geometry={cubeGeo} material={cubeMaterials[i]} />
          <lineSegments geometry={cubeEdgesGeo} material={edgeMaterials[i]} />
        </group>
      ))}
    </group>
  );
}
