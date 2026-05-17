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

const TUNNEL_VERT = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  varying vec2 vUv;
  varying float vZ;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(pos.z * 2.0 + uTime * 3.0) * uBass * 0.3;
    pos.x += cos(pos.y * 4.0 + uTime) * wave;
    pos.y += sin(pos.x * 4.0 + uTime * 1.3) * wave;
    vZ = (pos.z + 20.0) / 40.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const TUNNEL_FRAG = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uEnergy;
  varying vec2 vUv;
  varying float vZ;

  void main() {
    vec2 uv = vUv;
    float edge = abs(uv.x - 0.5) * 2.0;
    edge = pow(edge, 3.0);

    float bands = sin(uv.x * 40.0 + uTime * 5.0) * 0.5 + 0.5;
    bands *= sin(uv.y * 20.0 - uTime * 3.0) * 0.5 + 0.5;
    bands = pow(bands, 2.0);

    vec3 cyan = vec3(0.0, 0.96, 1.0);
    vec3 purple = vec3(0.61, 0.0, 1.0);
    vec3 pink = vec3(1.0, 0.0, 0.5);

    float t = uv.x + sin(uTime * 0.5) * 0.2;
    vec3 color = mix(cyan, purple, t);
    color = mix(color, pink, bands * uMid);
    color *= (1.0 + uBass * 2.0);
    color *= (edge * 3.0 + 0.3);
    color *= (vZ * 0.8 + 0.2);

    float glow = (1.0 - edge) * uEnergy * 0.5;
    color += glow * cyan;

    float alpha = edge * (0.6 + uBass * 0.4) + bands * 0.3;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function NeonTunnel({ audio, settings }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const ringRefs = useRef<THREE.Mesh[]>([]);

  const RING_COUNT = 40;
  const RING_SEGMENTS = 80;
  const TUNNEL_LENGTH = 40;
  const RADIUS = 3.5;

  const { ringGeometries, ringMaterial } = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: TUNNEL_VERT,
      fragmentShader: TUNNEL_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uEnergy: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });

    const geo = new THREE.CylinderGeometry(RADIUS, RADIUS, 1.0, RING_SEGMENTS, 1, true);
    return { ringGeometries: geo, ringMaterial: mat };
  }, []);

  const freqBandRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    const data = audio.getAnalysisData();
    const t = state.clock.elapsedTime;
    const freqData = data.frequencyData;

    ringMaterial.uniforms.uTime.value = t;
    ringMaterial.uniforms.uBass.value = data.bass;
    ringMaterial.uniforms.uMid.value = data.mid;
    ringMaterial.uniforms.uTreble.value = data.treble;
    ringMaterial.uniforms.uEnergy.value = data.energy;

    // Move rings toward camera, loop them
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      mesh.position.z += 0.35;
      if (mesh.position.z > 2) {
        mesh.position.z -= TUNNEL_LENGTH;
      }
      // Scale rings by frequency band
      const bandIdx = Math.floor((i / RING_COUNT) * freqData.length * 0.3);
      const freqVal = freqData[bandIdx] / 255;
      const scale = 1.0 + freqVal * settings.sensitivity * 0.4;
      mesh.scale.set(scale, 1, scale);
    });

    // Camera subtle wobble
    state.camera.position.x = Math.sin(t * 0.3) * 0.3;
    state.camera.position.y = Math.cos(t * 0.2) * 0.2;
    state.camera.lookAt(0, 0, -20);
  });

  const rings = useMemo(() => {
    return Array.from({ length: RING_COUNT }, (_, i) => {
      const z = -TUNNEL_LENGTH + (i / RING_COUNT) * TUNNEL_LENGTH;
      return { z, key: i };
    });
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {rings.map(({ z, key }) => (
        <mesh
          key={key}
          geometry={ringGeometries}
          material={ringMaterial}
          position={[0, 0, z]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}

      {/* Central streak lines */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * (RADIUS - 0.1);
        const y = Math.sin(angle) * (RADIUS - 0.1);
        return (
          <mesh key={`line-${i}`} position={[x, y, -TUNNEL_LENGTH / 2]}>
            <boxGeometry args={[0.02, 0.02, TUNNEL_LENGTH]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? '#00f5ff' : '#9b00ff'}
              transparent
              opacity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}
