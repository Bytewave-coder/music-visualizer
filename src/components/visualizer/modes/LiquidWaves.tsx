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

const WAVE_VERT = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uEnergy;
  uniform float uSensitivity;
  varying vec2 vUv;
  varying float vElevation;

  float wave(vec2 p, float freq, float speed, float amp) {
    return sin(p.x * freq + uTime * speed) * cos(p.y * freq * 0.7 + uTime * speed * 0.8) * amp;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    float elevation = 0.0;
    elevation += wave(pos.xz, 2.0, 1.5, uBass * uSensitivity * 1.5);
    elevation += wave(pos.xz, 3.5, -2.0, uMid * uSensitivity * 0.8);
    elevation += wave(pos.xz, 6.0, 3.0, uTreble * uSensitivity * 0.4);
    elevation += sin(length(pos.xz) * 1.5 - uTime * 2.0) * uEnergy * uSensitivity * 0.6;

    pos.y = elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WAVE_FRAG = `
  uniform float uTime;
  uniform float uBass;
  uniform float uEnergy;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float t = (vElevation + 2.0) / 4.0;
    t = clamp(t, 0.0, 1.0);

    // Liquid color gradient
    vec3 deep = vec3(0.0, 0.02, 0.15);
    vec3 mid1 = vec3(0.0, 0.4, 0.9);
    vec3 mid2 = vec3(0.3, 0.9, 1.0);
    vec3 peak = vec3(0.8, 1.0, 1.0);
    
    vec3 color;
    if (t < 0.3) {
      color = mix(deep, mid1, t / 0.3);
    } else if (t < 0.6) {
      color = mix(mid1, mid2, (t - 0.3) / 0.3);
    } else {
      color = mix(mid2, peak, (t - 0.6) / 0.4);
    }

    // Fresnel effect
    float fresnel = 1.0 - abs(vElevation / 2.0);
    fresnel = pow(fresnel, 3.0);
    color += fresnel * vec3(0.5, 0.8, 1.0) * uBass;

    // Shimmer
    float shimmer = sin(vUv.x * 30.0 + uTime * 4.0) * sin(vUv.y * 30.0 - uTime * 3.0);
    shimmer = pow(max(0.0, shimmer), 3.0);
    color += shimmer * vec3(1.0, 1.0, 1.0) * 0.3;

    float alpha = 0.7 + uEnergy * 0.3;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function LiquidWaves({ audio, settings }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);

  const { geo, mat, wireMat } = useMemo(() => {
    const SEGMENTS = 100;
    const geo = new THREE.PlaneGeometry(18, 18, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.ShaderMaterial({
      vertexShader: WAVE_VERT,
      fragmentShader: WAVE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uEnergy: { value: 0 },
        uSensitivity: { value: 1.2 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: '#00f5ff',
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });

    return { geo, mat, wireMat };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const data = audio.getAnalysisData();
    const t = state.clock.elapsedTime;

    mat.uniforms.uTime.value = t;
    mat.uniforms.uBass.value = data.bass;
    mat.uniforms.uMid.value = data.mid;
    mat.uniforms.uTreble.value = data.treble;
    mat.uniforms.uEnergy.value = data.energy;
    mat.uniforms.uSensitivity.value = settings.sensitivity;

    if (settings.cameraAutoRotate) {
      state.camera.position.set(
        Math.sin(t * 0.1) * 8,
        5 + data.bass * 2,
        Math.cos(t * 0.1) * 8
      );
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geo} material={mat} />
      <mesh ref={wireRef} geometry={geo} material={wireMat} />

      {/* Underwater glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial color="#000815" />
      </mesh>

      {/* Particle foam on surface */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={useMemo(() => {
              const arr = new Float32Array(200 * 3);
              for (let i = 0; i < 200; i++) {
                arr[i * 3] = (Math.random() - 0.5) * 18;
                arr[i * 3 + 1] = 0.1;
                arr[i * 3 + 2] = (Math.random() - 0.5) * 18;
              }
              return arr;
            }, [])}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#80d8ff"
          size={0.1}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
