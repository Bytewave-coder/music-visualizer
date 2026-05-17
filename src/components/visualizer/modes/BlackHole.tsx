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

const DISK_VERT = `
  uniform float uTime;
  uniform float uBass;
  uniform float uEnergy;
  varying vec2 vUv;
  varying float vRadius;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float r = length(pos.xz);
    vRadius = r;
    float warp = sin(r * 3.0 - uTime * 4.0) * uBass * 0.3;
    pos.y += warp;
    pos.y += cos(atan(pos.z, pos.x) * 3.0 + uTime * 2.0) * uEnergy * 0.15;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const DISK_FRAG = `
  uniform float uTime;
  uniform float uBass;
  uniform float uEnergy;
  uniform float uTreble;
  varying vec2 vUv;
  varying float vRadius;

  void main() {
    vec2 uv = vUv - 0.5;
    float r = length(uv) * 2.0;
    float angle = atan(uv.y, uv.x);

    // Accretion disk bands
    float band = sin(r * 20.0 - uTime * 8.0 + angle * 2.0) * 0.5 + 0.5;
    band *= sin(r * 8.0 + uTime * 3.0) * 0.5 + 0.5;

    // Color: hot inner = white/blue, outer = orange/red
    vec3 innerColor = vec3(1.0, 0.9, 0.7);
    vec3 midColor = vec3(1.0, 0.4, 0.0);
    vec3 outerColor = vec3(0.6, 0.0, 0.3);

    float t = smoothstep(0.0, 1.0, vRadius / 6.0);
    vec3 color = mix(innerColor, midColor, t);
    color = mix(color, outerColor, t * t);

    color *= (1.0 + uBass * 2.0);
    color *= band * 1.5 + 0.3;
    color += vec3(0.0, 0.5, 1.0) * uTreble * 0.5;

    // Fade toward center (event horizon)
    float centerFade = smoothstep(0.2, 0.6, r);
    // Fade at edge
    float edgeFade = 1.0 - smoothstep(0.7, 1.0, r);

    float alpha = band * centerFade * edgeFade * (0.6 + uEnergy * 0.4);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function BlackHole({ audio, settings }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const diskMatRef = useRef<THREE.ShaderMaterial>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const particleMatRef = useRef<THREE.ShaderMaterial>(null!);

  const PARTICLE_COUNT = 3000;

  const diskGeo = useMemo(() => {
    const geo = new THREE.RingGeometry(1.5, 7, 128, 32);
    return geo;
  }, []);

  const diskMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: DISK_VERT,
    fragmentShader: DISK_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uEnergy: { value: 0 },
      uTreble: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), []);

  const particleData = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const lifetimes = new Float32Array(PARTICLE_COUNT);
    const angles = new Float32Array(PARTICLE_COUNT);
    const radii = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = Math.random() * 5 + 1.8;
      positions[i * 3] = Math.cos(angles[i]) * radii[i];
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      lifetimes[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    const pos = new THREE.BufferAttribute(positions, 3);
    pos.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', pos);

    const mat = new THREE.PointsMaterial({
      color: new THREE.Color('#ff6b00'),
      size: 0.04,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geo, mat, positions, velocities, lifetimes, angles, radii };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const data = audio.getAnalysisData();
    const t = state.clock.elapsedTime;

    diskMat.uniforms.uTime.value = t;
    diskMat.uniforms.uBass.value = data.bass;
    diskMat.uniforms.uEnergy.value = data.energy;
    diskMat.uniforms.uTreble.value = data.treble;

    // Animate particles spiraling inward
    const { positions, velocities, radii, angles } = particleData;
    const spiralSpeed = 0.01 + data.bass * 0.05 * settings.sensitivity;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      angles[i] += spiralSpeed * (1.0 / (radii[i] * 0.3 + 0.1));
      radii[i] -= 0.003 + data.energy * 0.01;
      if (radii[i] < 0.5) {
        radii[i] = Math.random() * 3 + 3;
        angles[i] = Math.random() * Math.PI * 2;
      }
      positions[i * 3] = Math.cos(angles[i]) * radii[i];
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1 * data.energy;
      positions[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
    }

    particleData.geo.attributes.position.needsUpdate = true;

    groupRef.current.rotation.y = t * 0.05;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;

    if (settings.cameraAutoRotate) {
      const angle = t * 0.07;
      state.camera.position.set(
        Math.cos(angle) * 10,
        4 + Math.sin(t * 0.15) * 2,
        Math.sin(angle) * 10
      );
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Event horizon sphere */}
      <mesh>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Dark halo */}
      <mesh>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#0a0015" transparent opacity={0.9} />
      </mesh>

      {/* Accretion disk */}
      <mesh
        ref={(m) => { if (m) diskMatRef.current = m.material as THREE.ShaderMaterial; }}
        geometry={diskGeo}
        material={diskMat}
        rotation={[Math.PI * 0.05, 0, 0]}
      />
      <mesh
        geometry={diskGeo}
        material={diskMat}
        rotation={[Math.PI * -0.05, Math.PI * 0.3, 0]}
      />

      {/* Spiral particles */}
      <points
        ref={particlesRef}
        geometry={particleData.geo}
        material={particleData.mat}
      />

      {/* Ambient glow */}
      <mesh>
        <sphereGeometry args={[2.2, 16, 16]} />
        <meshBasicMaterial color="#3300ff" transparent opacity={0.04} />
      </mesh>
    </group>
  );
}
