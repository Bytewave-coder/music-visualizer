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

export function SpaceWarp({ audio, settings }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const STAR_COUNT = 5000;

  const { geometry, material, posArray, speedArray } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const speeds = new Float32Array(STAR_COUNT);
    const sizes = new Float32Array(STAR_COUNT);
    const colors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 8 + 0.5;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      speeds[i] = 0.5 + Math.random() * 2;
      sizes[i] = Math.random() * 2 + 0.5;

      const brightness = 0.7 + Math.random() * 0.3;
      // Slight color variation
      const hue = Math.random() * 0.15;
      const c = new THREE.Color().setHSL(0.55 + hue, 0.5, brightness);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vZ;
        uniform float uSpeed;
        uniform float uBass;

        void main() {
          vColor = aColor;
          vZ = (position.z + 100.0) / 200.0;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float stretch = 1.0 + uSpeed * 5.0 * (1.0 - vZ);
          gl_PointSize = aSize * (1.0 + uBass * 3.0) * (150.0 / -mvPos.z) * stretch;
          gl_PointSize = clamp(gl_PointSize, 0.5, 20.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vZ;

        void main() {
          vec2 coord = gl_PointCoord - 0.5;
          // Elongated star shape
          float d = sqrt(coord.x * coord.x * 4.0 + coord.y * coord.y);
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0);
          alpha *= 0.4 + vZ * 0.6;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      uniforms: {
        uSpeed: { value: 0 },
        uBass: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat, posArray: positions, speedArray: speeds };
  }, []);

  const warpSpeedRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    const data = audio.getAnalysisData();
    const t = state.clock.elapsedTime;

    // Warp speed increases with bass
    const targetSpeed = 0.8 + data.bass * settings.sensitivity * 4;
    warpSpeedRef.current += (targetSpeed - warpSpeedRef.current) * 0.1;

    material.uniforms.uSpeed.value = warpSpeedRef.current * 0.1;
    material.uniforms.uBass.value = data.bass;

    // Move stars toward camera
    const step = warpSpeedRef.current * 0.8;
    for (let i = 0; i < STAR_COUNT; i++) {
      posArray[i * 3 + 2] += step * speedArray[i] * 0.1;
      if (posArray[i * 3 + 2] > 5) {
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * 8 + 0.5;
        posArray[i * 3] = Math.cos(theta) * r;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 4;
        posArray[i * 3 + 2] = -200;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    // Subtle camera rotation
    state.camera.position.set(
      Math.sin(t * 0.1) * 0.3,
      Math.cos(t * 0.07) * 0.3,
      3
    );
    state.camera.lookAt(0, 0, -50);
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} />

      {/* Warp ring effects */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 0, -i * 25 - 10]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[6 - i * 0.2, 0.02, 8, 64]} />
          <meshBasicMaterial
            color="#00f5ff"
            transparent
            opacity={0.05 + i * 0.01}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
