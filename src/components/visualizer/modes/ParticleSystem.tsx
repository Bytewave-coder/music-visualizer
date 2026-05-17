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

const VERT = `
  attribute float aLife;
  attribute vec3 aVelocity;
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uBass;
  uniform float uEnergy;
  uniform float uSensitivity;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    vec3 pos = position;
    
    // Breathing motion
    float breathing = sin(uTime * 1.5 + pos.x + pos.y) * 0.5 + 0.5;
    
    // Audio push
    float dist = length(pos);
    float push = uBass * uSensitivity * 2.0;
    pos += normalize(pos) * push * (1.0 - dist / 10.0);
    
    // Orbit motion
    float speed = 0.3 + aLife * 0.5;
    float angle = atan(pos.z, pos.x) + uTime * speed * 0.1;
    float r = length(pos.xz);
    pos.x = cos(angle) * r;
    pos.z = sin(angle) * r;
    pos.y += sin(uTime * speed + aLife * 10.0) * 0.05;
    
    vAlpha = aLife * (0.6 + breathing * 0.4);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * (1.0 + uBass * uSensitivity * 3.0) * (200.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 15.0);
  }
`;

const FRAG = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float d = length(coord);
    if (d > 0.5) discard;

    float alpha = (1.0 - d * 2.0);
    alpha = pow(alpha, 2.0) * vAlpha;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function ParticleSystem({ audio, settings }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const COUNT = 8000;

  const { geometry, material, posArray, colorArray } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    const lives = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    const palette = [
      new THREE.Color('#00f5ff'),
      new THREE.Color('#9b00ff'),
      new THREE.Color('#ff0080'),
      new THREE.Color('#00ff94'),
      new THREE.Color('#ffd700'),
    ];

    for (let i = 0; i < COUNT; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * 7;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      lives[i] = Math.random();
      sizes[i] = Math.random() * 2.5 + 0.5;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('aLife', new THREE.BufferAttribute(lives, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uEnergy: { value: 0 },
        uSensitivity: { value: 1.2 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat, posArray: positions, colorArray: colors };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const data = audio.getAnalysisData();
    const t = state.clock.elapsedTime;

    material.uniforms.uTime.value = t;
    material.uniforms.uBass.value = data.bass;
    material.uniforms.uEnergy.value = data.energy;
    material.uniforms.uSensitivity.value = settings.sensitivity;

    groupRef.current.rotation.y = t * 0.04;
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.2;

    if (settings.cameraAutoRotate) {
      const cAngle = t * 0.06;
      state.camera.position.set(
        Math.cos(cAngle) * (12 - data.bass * 3),
        Math.sin(t * 0.08) * 3 + 3,
        Math.sin(cAngle) * (12 - data.bass * 3)
      );
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} />
    </group>
  );
}
