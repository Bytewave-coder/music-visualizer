'use client';

import { useCallback } from 'react';
import { MdClose, MdAutoFixHigh, MdElectricBolt, MdAir, MdFlare } from 'react-icons/md';
import { useVisualizerStore } from '@/store/useVisualizerStore';
import { THEMES, Theme } from '@/types';
import clsx from 'clsx';

/* ── Toggle switch ────────────────────────────────────────────── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={clsx('toggle-track', on ? 'on' : 'off')}
    >
      <span className={clsx('toggle-thumb', on ? 'on' : 'off')} />
    </button>
  );
}

/* ── Slider row ───────────────────────────────────────────────── */
function SliderRow({
  label, value, min, max, step, onChange, color,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-mono)' }}>
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          background: `linear-gradient(to right, ${color ?? 'var(--accent-primary)'} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
        }}
      />
    </div>
  );
}

/* ── MAIN COMPONENT ───────────────────────────────────────────── */
interface Props { onClose: () => void; onThemeChange: (t: Theme) => void; }

const PRESETS = [
  { id: 'default', label: 'Default',  Icon: MdAutoFixHigh },
  { id: 'intense', label: 'Intense',  Icon: MdElectricBolt },
  { id: 'calm',    label: 'Calm',     Icon: MdAir },
  { id: 'neon',    label: 'Neon',     Icon: MdFlare },
];

export function CustomizationPanel({ onClose, onThemeChange }: Props) {
  const {
    theme, sensitivity, particleIntensity, glowIntensity, bloomStrength,
    cameraAutoRotate, showGrid,
    setSensitivity, setParticleIntensity, setGlowIntensity, setBloomStrength,
    toggleAutoRotate, toggleGrid, applyPreset,
  } = useVisualizerStore();

  const handleTheme = useCallback((t: Theme) => {
    onThemeChange(t);
  }, [onThemeChange]);

  return (
    <div className="side-panel" style={{ height: '100%' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Customize</span>
        <button className="panel-close" onClick={onClose}>
          <MdClose style={{ fontSize: 16 }} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Presets ─────────────────────────────────────── */}
        <section>
          <span className="section-label">Quick Presets</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PRESETS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => applyPreset(id)}
                className="btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  padding: '9px 12px',
                  borderRadius: 12,
                  fontSize: 13,
                }}
              >
                <Icon style={{ fontSize: 16, color: 'var(--accent-primary)', flexShrink: 0 }} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Themes ──────────────────────────────────────── */}
        <section>
          <span className="section-label">Theme</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {THEMES.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTheme(t.id as Theme)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    transition: 'background .15s ease',
                    width: '100%', textAlign: 'left',
                  }}
                >
                  {/* Color dots */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.primaryColor }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.secondaryColor }} />
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 500,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.50)',
                    flex: 1,
                  }}>
                    {t.label}
                  </span>
                  {isActive && (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent-primary)',
                      boxShadow: '0 0 6px var(--glow-primary)',
                      flexShrink: 0,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Audio Reactivity ────────────────────────────── */}
        <section>
          <span className="section-label">Audio Reactivity</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SliderRow
              label="Sensitivity"
              value={sensitivity} min={0.1} max={3.0} step={0.05}
              onChange={setSensitivity}
              color="var(--accent-primary)"
            />
            <SliderRow
              label="Particle Intensity"
              value={particleIntensity} min={0} max={1} step={0.01}
              onChange={setParticleIntensity}
              color="var(--accent-secondary)"
            />
          </div>
        </section>

        {/* ── Visual Effects ───────────────────────────────── */}
        <section>
          <span className="section-label">Visual Effects</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SliderRow
              label="Bloom Strength"
              value={bloomStrength} min={0} max={4} step={0.1}
              onChange={setBloomStrength}
              color="var(--accent-primary)"
            />
            <SliderRow
              label="Glow Intensity"
              value={glowIntensity} min={0} max={3} step={0.05}
              onChange={setGlowIntensity}
              color="var(--accent-tertiary)"
            />
          </div>
        </section>

        {/* ── Options ─────────────────────────────────────── */}
        <section>
          <span className="section-label">Options</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {([
              { label: 'Auto-rotate Camera', on: cameraAutoRotate, toggle: toggleAutoRotate },
              { label: 'Show Grid',           on: showGrid,         toggle: toggleGrid },
            ] as const).map(({ label, on, toggle }) => (
              <div
                key={label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 2px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                <Toggle on={on} onToggle={toggle} />
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
