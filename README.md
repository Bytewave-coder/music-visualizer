# 🎵 AURA — 3D Music Visualizer

A premium, cinematic 3D music visualizer built with Next.js 14, React Three Fiber, Three.js, Framer Motion, and the Web Audio API.

---

## 📁 Project Folder Structure

```
music-visualizer/
│
├── 📦 package.json              ← All npm dependencies
├── ⚙️  next.config.js           ← Next.js build configuration
├── 🔷 tsconfig.json             ← TypeScript compiler options
├── 🎨 tailwind.config.ts        ← Tailwind CSS design tokens & custom colors
├── ⚙️  postcss.config.js        ← PostCSS for Tailwind processing
│
└── src/
    │
    ├── 📁 app/                  ← NEXT.JS APP ROUTER (pages & layout)
    │   ├── layout.tsx           ← Root HTML layout, metadata, font imports
    │   ├── page.tsx             ← Entry page — lazy-loads MusicVisualizer
    │   └── globals.css          ← Global styles, CSS variables, themes, animations
    │
    ├── 📁 components/           ← ALL REACT UI COMPONENTS
    │   │
    │   ├── MusicVisualizer.tsx  ← 🌟 ROOT APP COMPONENT
    │   │                           Wires together: audio engine, visualizer,
    │   │                           player, panels, and state. Start here.
    │   │
    │   ├── 📁 player/           ← AUDIO PLAYER CONTROLS
    │   │   └── PlayerControls.tsx  Play/pause, seek bar, volume, shuffle,
    │   │                           repeat, fullscreen, playlist toggle
    │   │
    │   ├── 📁 visualizer/       ← 3D VISUALIZER ENGINE
    │   │   ├── VisualizerScene.tsx  React Three Fiber Canvas wrapper.
    │   │   │                        Mounts the correct mode + post-processing
    │   │   │                        (Bloom, Chromatic Aberration via R3F).
    │   │   │
    │   │   └── 📁 modes/        ← INDIVIDUAL VISUALIZER SCENES
    │   │       ├── GalaxyVisualizer.tsx    Spiral galaxy, 12,000 particles,
    │   │       │                           custom GLSL vertex + fragment shaders
    │   │       ├── NeonTunnel.tsx          Infinite neon corridor with
    │   │       │                           animated shader rings
    │   │       ├── BlackHole.tsx           Accretion disk + spiral particle drain
    │   │       ├── CircularSpectrum.tsx    Radial frequency bars (inner + outer)
    │   │       ├── ParticleSystem.tsx      8,000-particle orbital cloud,
    │   │       │                           custom GLSL shaders
    │   │       ├── AudioWaveTerrain.tsx    Frequency-mapped 3D terrain mesh
    │   │       │                           with DataTexture frequency sampling
    │   │       ├── SpaceWarp.tsx           Hyperspace star-field tunnel,
    │   │       │                           bass-reactive warp speed
    │   │       ├── FloatingCubes.tsx       10×6 grid of reactive wireframe cubes
    │   │       ├── LiquidWaves.tsx         Fluid wave surface with GLSL fresnel
    │   │       └── MinimalSpectrum.tsx     Clean mirrored frequency bars
    │   │
    │   └── 📁 ui/               ← GENERAL UI PANELS & OVERLAYS
    │       ├── FileUploader.tsx     Drag-and-drop audio file upload modal
    │       ├── Playlist.tsx         Scrollable track list with play/remove
    │       ├── VisualizerSelector.tsx  Grid of visualizer mode cards
    │       └── CustomizationPanel.tsx  Theme, sensitivity, bloom, toggles
    │
    ├── 📁 hooks/                ← CUSTOM REACT HOOKS
    │   └── useAudioAnalyzer.ts  Web Audio API engine:
    │                              AudioContext → AnalyserNode → FFT data
    │                              Returns: bass / mid / treble / energy / beat / BPM
    │
    ├── 📁 store/                ← ZUSTAND GLOBAL STATE
    │   ├── usePlayerStore.ts    Player state: currentTrack, playlist, isPlaying,
    │   │                         currentTime, duration, volume, shuffle, repeat
    │   └── useVisualizerStore.ts Visualizer state: mode, theme, sensitivity,
    │                              bloomStrength, particleIntensity, autoRotate
    │
    └── 📁 types/               ← TYPESCRIPT TYPE DEFINITIONS
        └── index.ts             Track, VisualizerMode, Theme, AudioAnalysisData,
                                  VisualizerSettings, PlayerState, and constants
                                  (VISUALIZER_MODES array, THEMES array)
```

---

## 🗂 What Goes Where — Decision Guide

| You want to...                         | File to edit                                |
|----------------------------------------|---------------------------------------------|
| Add a new page / route                 | `src/app/` — create a new folder + page.tsx |
| Change global fonts or CSS vars        | `src/app/globals.css`                       |
| Add a new visualizer mode              | `src/components/visualizer/modes/` + register in `VisualizerScene.tsx` and `src/types/index.ts` |
| Change how audio data is extracted     | `src/hooks/useAudioAnalyzer.ts`             |
| Add player feature (lyrics, EQ, etc.) | `src/components/player/`                    |
| Add a new theme                        | `globals.css` (`.theme-name` class) + `src/types/index.ts` THEMES array |
| Add a new UI panel or modal            | `src/components/ui/`                        |
| Add global state                       | `src/store/`                                |
| Add a new TypeScript type              | `src/types/index.ts`                        |
| Change Tailwind colors / animations    | `tailwind.config.ts`                        |

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 📦 Key Dependencies

| Library                  | Purpose                              |
|--------------------------|--------------------------------------|
| `next` 14                | App Router, SSR, code splitting      |
| `@react-three/fiber`     | React renderer for Three.js          |
| `@react-three/drei`      | R3F helpers (Stars, OrbitControls)   |
| `@react-three/postprocessing` | Bloom, ChromaticAberration      |
| `three`                  | 3D engine, shaders, geometries       |
| `framer-motion`          | UI animations, transitions           |
| `zustand`                | Lightweight global state             |
| `lucide-react`           | Icon library                         |
| `tailwindcss`            | Utility-first CSS                    |
| `postprocessing`         | GPU post-FX (required by R3F PP)    |

---

## 🎨 Visualizer Modes

| Mode               | Description                              |
|--------------------|------------------------------------------|
| 🌌 Galaxy          | Spiral galaxy — 12K particles, GLSL      |
| ✨ Particles        | Orbital particle cloud — 8K particles    |
| 🔮 Neon Tunnel     | Infinite animated neon corridor          |
| 🏔️ Wave Terrain    | 3D audio frequency landscape             |
| 🕳️ Black Hole      | Accretion disk + particle drain          |
| 🎯 Circular Spectrum| Radial bars from center                 |
| 🌊 Liquid Waves    | Fluid surface with fresnel shading       |
| 🚀 Space Warp      | Hyperspace star tunnel                   |
| 🧊 Floating Cubes  | Reactive wireframe geometry grid         |
| 📊 Minimal Spectrum| Clean mirrored frequency bars            |

---

## 🎨 Themes

`cosmic` · `cyberpunk` · `anime` · `amoled` · `space` · `retro` · `monochrome`

All themes are applied via CSS custom properties on `body`. Swap at runtime via the Customize panel.

---

## ⚡ Audio Reactivity

Every visualizer reads these values from `useAudioAnalyzer` on every animation frame:

- **bass** — sub-bass energy (0–1)
- **mid** — midrange presence (0–1)
- **treble** — high-frequency sparkle (0–1)
- **energy** — overall loudness (0–1)
- **beat** — boolean impulse on transient
- **bpm** — estimated tempo
- **frequencyData** — raw `Uint8Array[1024]` FFT bins

---

## 📝 Notes

- AudioContext is created on first user interaction (browser security requirement)
- All visualizers use `THREE.AdditiveBlending` + `depthWrite: false` for glow layering
- Bloom is applied globally via `@react-three/postprocessing` EffectComposer
- File URLs created via `URL.createObjectURL()` — revoke on unmount if needed for long sessions
