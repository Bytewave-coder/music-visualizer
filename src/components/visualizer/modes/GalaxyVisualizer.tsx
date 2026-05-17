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

const VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAngle;
  attribute float aRadius;
  attribute float aRandomY;

  uniform float uTime;
  uniform float uBass;
  uniform float uEnergy;
  uniform float uSensitivity;

  varying vec3 vColor;
  varying float vDist;

  void main() {
    vColor = aColor;
    
    float angle = aAngle + uTime * 0.15 * (1.0 + uBass * 0.5);
    float radius = aRadius * (1.0 + uBass * uSensitivity * 0.3);
    
    vec3 pos = position;
    pos.x = cos(angle) * radius;
    pos.z = sin(angle) * radius;
    pos.y = aRandomY + sin(uTime * 0.5 + aRadius) * 0.2 * uEnergy;
    
    vDist = length(pos.xz) / 8.0;
    
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * (1.0 + uBass * uSensitivity * 2.0) * (300.0 / -mvPos.z);
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vDist;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    
    float alpha = (1.0 - d * 2.0);
    alpha *= 1.0 - vDist * 0.6;
    alpha = pow(alpha, 1.5);
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function GalaxyVisualizer({ audio, settings }: Props) {
  const particlesRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  const COUNT = 12000;

  const { geometry, positions, colors, sizes, angles, radii, randomY } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const angles = new Float32Array(COUNT);
    const radii = new Float32Array(COUNT);
    const randomY = new Float32Array(COUNT);

    const innerColor = new THREE.Color('#00f5ff');
    const outerColor = new THREE.Color('#9b00ff');
    const armColor = new THREE.Color('#ff0080');

    const ARMS = 3;
    const SPIN = 2.0;

    for (let i = 0; i < COUNT; i++) {
      const arm = i % ARMS;
      const radius = Math.pow(Math.random(), 0.5) * 8.0;
      const spinAngle = radius * SPIN;
      const branchAngle = (arm / ARMS) * Math.PI * 2;
      const scatter = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);

      const x = Math.cos(branchAngle + spinAngle) * radius + scatter * 0.5;
      const y = (Math.random() - 0.5) * 0.4;
      const z = Math.sin(branchAngle + spinAngle) * radius + scatter * 0.5;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      angles[i] = branchAngle + spinAngle;
      radii[i] = radius;
      randomY[i] = y;

      sizes[i] = Math.random() * 2.5 + 0.5;

      const t = radius / 8.0;
      let mixedColor: THREE.Color;
      if (arm === 0) {
        mixedColor = innerColor.clone().lerp(outerColor, t);
      } else if (arm === 1) {
        mixedColor = outerColor.clone().lerp(armColor, t);
      } else {
        mixedColor = armColor.clone().lerp(innerColor, t);
      }
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    geo.setAttribute('aRandomY', new THREE.BufferAttribute(randomY, 1));

    return { geometry: geo, positions, colors, sizes, angles, radii, randomY };
  }, []);

  useFrame((state) => {
    if (!materialRef.current || !groupRef.current) return;

    const data = audio.getAnalysisData();
    const t = state.clock.elapsedTime;

    materialRef.current.uniforms.uTime.value = t;
    materialRef.current.uniforms.uBass.value = data.bass;
    materialRef.current.uniforms.uEnergy.value = data.energy;
    materialRef.current.uniforms.uSensitivity.value = settings.sensitivity;

    groupRef.current.rotation.y = t * 0.05;
    if (settings.cameraAutoRotate) {
      const cameraAngle = t * 0.08;
      const cameraHeight = Math.sin(t * 0.1) * 3 + 4;
      state.camera.position.set(
        Math.cos(cameraAngle) * (12 - data.bass * 2),
        cameraHeight,
        Math.sin(cameraAngle) * (12 - data.bass * 2)
      );
      state.camera.lookAt(0, 0, 0);
    }
  });

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uEnergy: { value: 0 },
      uSensitivity: { value: 1.2 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  return (
    <group ref={groupRef}>
      <points ref={particlesRef} geometry={geometry} material={material}>
        <primitive object={material} ref={materialRef} />
      </points>

      {/* Central core glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}
