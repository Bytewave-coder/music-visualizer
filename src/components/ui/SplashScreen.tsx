'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation, Variants } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

/* ─── tiny hook: count up a number ─────────────────────── */
function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

/* ─── animated canvas: audio-wave ring ─────────────────── */
function WaveRing({ size, phase }: { size: number; phase: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2, cy = size / 2;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      const POINTS = 256;
      const baseR = size * 0.36;
      const ampR  = size * 0.06;

      // Outer glow passes
      for (let pass = 3; pass >= 1; pass--) {
        ctx.beginPath();
        for (let i = 0; i <= POINTS; i++) {
          const angle = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
          const wave =
            Math.sin(i / POINTS * Math.PI * 8 + t * 2.5 + phase) * 0.55 +
            Math.sin(i / POINTS * Math.PI * 5 - t * 1.8 + phase * 1.3) * 0.3 +
            Math.sin(i / POINTS * Math.PI * 3 + t * 3.1) * 0.15;
          const r = baseR + wave * ampR;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(0,245,255,${0.06 * pass})`;
        ctx.lineWidth = pass * 4;
        ctx.stroke();
      }

      // Main ring
      ctx.beginPath();
      for (let i = 0; i <= POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
        const wave =
          Math.sin(i / POINTS * Math.PI * 8 + t * 2.5 + phase) * 0.55 +
          Math.sin(i / POINTS * Math.PI * 5 - t * 1.8 + phase * 1.3) * 0.3 +
          Math.sin(i / POINTS * Math.PI * 3 + t * 3.1) * 0.15;
        const r = baseR + wave * ampR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Gradient stroke
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0,    '#00f5ff');
      grad.addColorStop(0.35, '#9b00ff');
      grad.addColorStop(0.65, '#ff0080');
      grad.addColorStop(1,    '#00f5ff');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const startTime = performance.now();
    const loop = () => {
      draw((performance.now() - startTime) / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, phase]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}

/* ─── rotating dashed orbit ring ───────────────────────── */
function OrbitRing({ radius, speed, color, dashed = false }: {
  radius: number; speed: number; color: string; dashed?: boolean;
}) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: speed, ease: 'linear' }}
      style={{
        position: 'absolute',
        width: radius * 2,
        height: radius * 2,
        top: '50%',
        left: '50%',
        marginTop: -radius,
        marginLeft: -radius,
        borderRadius: '50%',
        border: `1px ${dashed ? 'dashed' : 'solid'} ${color}`,
        opacity: 0.25,
      }}
    />
  );
}

/* ─── floating particle dot ─────────────────────────────── */
function Particle({ x, y, size, color, delay }: {
  x: string; y: string; size: number; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0.4, 0.8, 0],
        scale:   [0, 1, 0.7, 1, 0],
        y:       [0, -30, -20, -40, -60],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        position: 'absolute',
        left: x, top: y,
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${size * 3}px ${color}`,
        filter: 'blur(0.5px)',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ─── bar visualizer at bottom of logo ─────────────────── */
function BarEqualizer({ active }: { active: boolean }) {
  const BARS = [0.35, 0.55, 0.75, 0.9, 1.0, 0.9, 0.75, 0.55, 0.35];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 20 }}>
      {BARS.map((h, i) => (
        <motion.div
          key={i}
          animate={active ? {
            scaleY: [h, h * 0.4, h * 1.1, h * 0.6, h],
          } : { scaleY: 0.15 }}
          transition={{
            duration: 0.8 + i * 0.05,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.06,
          }}
          style={{
            width: 3,
            height: '100%',
            borderRadius: 2,
            transformOrigin: 'bottom',
            background: `linear-gradient(to top, #00f5ff, #9b00ff)`,
            boxShadow: '0 0 6px rgba(0,245,255,0.5)',
          }}
        />
      ))}
    </div>
  );
}

/* ─── MAIN SPLASH SCREEN ────────────────────────────────── */
export function SplashScreen({ onComplete }: Props) {
  const [stage, setStage]   = useState<'enter' | 'loading' | 'exit'>('enter');
  const [pct,   setPct]     = useState(0);
  const [done,  setDone]    = useState(false);
  const countUp = useCountUp(100, 2400, stage === 'loading');

  // Stage timeline
  useEffect(() => {
    const t1 = setTimeout(() => setStage('loading'), 600);
    return () => clearTimeout(t1);
  }, []);

  // Fake loading progress
  useEffect(() => {
    if (stage !== 'loading') return;
    const interval = setInterval(() => {
      setPct((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        const jump = p < 60 ? Math.random() * 8 + 2
                   : p < 85 ? Math.random() * 4 + 1
                             : Math.random() * 2 + 0.5;
        return Math.min(100, p + jump);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [stage]);

  // When 100% → exit
  useEffect(() => {
    if (pct >= 100 && stage === 'loading' && !done) {
      setDone(true);
      setTimeout(() => setStage('exit'), 500);
      setTimeout(onComplete, 1500);
    }
  }, [pct, stage, done, onComplete]);

  const LOGO_SIZE = 200;

  const particles = [
    { x: '12%', y: '20%', size: 4, color: '#00f5ff', delay: 0 },
    { x: '85%', y: '15%', size: 3, color: '#9b00ff', delay: 0.5 },
    { x: '6%',  y: '70%', size: 5, color: '#ff0080', delay: 1.2 },
    { x: '90%', y: '75%', size: 4, color: '#00f5ff', delay: 0.8 },
    { x: '50%', y: '8%',  size: 3, color: '#9b00ff', delay: 1.8 },
    { x: '25%', y: '85%', size: 4, color: '#ff0080', delay: 0.3 },
    { x: '75%', y: '88%', size: 3, color: '#00f5ff', delay: 1.5 },
    { x: '40%', y: '92%', size: 2, color: '#9b00ff', delay: 2.1 },
    { x: '65%', y: '5%',  size: 3, color: '#ffd700', delay: 0.9 },
    { x: '3%',  y: '42%', size: 4, color: '#00ff94', delay: 2.4 },
    { x: '97%', y: '48%', size: 3, color: '#ff0080', delay: 1.1 },
    { x: '55%', y: '95%', size: 2, color: '#00f5ff', delay: 0.6 },
  ];

  return (
    <AnimatePresence>
      {stage !== 'exit' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#050510',
            overflow: 'hidden',
          }}
        >
          {/* ── Background grid ─────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage:
              'linear-gradient(rgba(0,245,255,0.4) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(0,245,255,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

          {/* ── Radial glow blobs ───────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
          }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: '20%', left: '10%',
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(155,0,255,0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.45, 0.25] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
              style={{
                position: 'absolute', bottom: '15%', right: '8%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,245,255,0.12) 0%, transparent 70%)',
                filter: 'blur(50px)',
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
              style={{
                position: 'absolute', top: '55%', left: '40%',
                width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,0,128,0.1) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
            />
          </div>

          {/* ── Floating particles ──────────────────────── */}
          {particles.map((p, i) => <Particle key={i} {...p} />)}

          {/* ── Orbit rings ─────────────────────────────── */}
          <div style={{ position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
            <OrbitRing radius={180} speed={20} color="rgba(0,245,255,0.6)" dashed />
            <OrbitRing radius={240} speed={30} color="rgba(155,0,255,0.5)" />
            <OrbitRing radius={300} speed={45} color="rgba(255,0,128,0.4)" dashed />
          </div>

          {/* ── Logo group ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column',
                     alignItems: 'center', gap: 0 }}
          >
            {/* Wave ring canvas + logo badge */}
            <div style={{ position: 'relative', width: LOGO_SIZE, height: LOGO_SIZE }}>
              <WaveRing size={LOGO_SIZE} phase={0} />
              <WaveRing size={LOGO_SIZE} phase={Math.PI} />

              {/* Centre badge */}
              <motion.div
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 88, height: 88,
                  borderRadius: 22,
                  background: 'linear-gradient(135deg, #00f5ff 0%, #9b00ff 60%, #ff0080 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(0,245,255,0.4), 0 0 80px rgba(155,0,255,0.2)',
                }}
              >
                <span style={{
                  color: '#000',
                  fontSize: 38,
                  fontWeight: 800,
                  fontFamily: 'Syne, sans-serif',
                  letterSpacing: '-2px',
                  userSelect: 'none',
                }}>
                  A
                </span>
              </motion.div>

              {/* Pulsing halo */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', inset: -20,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,245,255,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              style={{ textAlign: 'center', marginTop: 12 }}
            >
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 52,
                letterSpacing: 12,
                color: '#fff',
                lineHeight: 1,
                textShadow: '0 0 40px rgba(0,245,255,0.5)',
              }}>
                AURA
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                letterSpacing: 6,
                color: 'rgba(255,255,255,0.3)',
                marginTop: 6,
                textTransform: 'uppercase',
              }}>
                3D Music Visualizer
              </div>
            </motion.div>

            {/* Bar equalizer under title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{ marginTop: 14 }}
            >
              <BarEqualizer active={stage === 'loading'} />
            </motion.div>
          </motion.div>

          {/* ── Loading section ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{
              position: 'absolute',
              bottom: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              width: 280,
            }}
          >
            {/* Percentage */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 2,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              <motion.span
                key={countUp}
                style={{ fontSize: 13, color: 'rgba(0,245,255,0.9)', fontWeight: 500 }}
              >
                {countUp}
              </motion.span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>%</span>
            </div>

            {/* Progress track */}
            <div style={{
              width: '100%', height: 2,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Fill */}
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ ease: 'easeOut', duration: 0.25 }}
                style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  background: 'linear-gradient(90deg, #00f5ff, #9b00ff, #ff0080)',
                  borderRadius: 2,
                  boxShadow: '0 0 8px rgba(0,245,255,0.6)',
                }}
              />
              {/* Shimmer */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  width: '40%',
                }}
              />
            </div>

            {/* Status text */}
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                letterSpacing: 3,
                color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase',
              }}
            >
              {pct < 30  ? 'Initializing engine'
               : pct < 55 ? 'Loading shaders'
               : pct < 75 ? 'Compiling visualizers'
               : pct < 92 ? 'Calibrating audio'
               :             'Ready'}
            </motion.div>
          </motion.div>

          {/* ── Corner decorations ──────────────────────── */}
          {(['top-left','top-right','bottom-left','bottom-right'] as const).map((corner) => (
            <div key={corner} style={{
              position: 'absolute',
              ...(corner.includes('top')    ? { top: 20 }    : { bottom: 20 }),
              ...(corner.includes('left')   ? { left: 20 }   : { right: 20 }),
              width: 30, height: 30,
              borderTop:    corner.includes('top')    ? '1px solid rgba(0,245,255,0.25)' : undefined,
              borderBottom: corner.includes('bottom') ? '1px solid rgba(0,245,255,0.25)' : undefined,
              borderLeft:   corner.includes('left')   ? '1px solid rgba(0,245,255,0.25)' : undefined,
              borderRight:  corner.includes('right')  ? '1px solid rgba(0,245,255,0.25)' : undefined,
            }} />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
