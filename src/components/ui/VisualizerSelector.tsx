'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdCheckCircle } from 'react-icons/md';
import { useVisualizerStore } from '@/store/useVisualizerStore';
import { VISUALIZER_MODES, VisualizerMode } from '@/types';

interface Props { onClose: () => void; }

export function VisualizerSelector({ onClose }: Props) {
  const { mode, setMode } = useVisualizerStore();

  return (
    <div className="side-panel">
      <div className="panel-header">
        <span className="panel-title">Visualizer Modes</span>
        <button className="panel-close" onClick={onClose}>
          <MdClose style={{ fontSize: 16 }} />
        </button>
      </div>

      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {VISUALIZER_MODES.map((m, i) => {
          const isActive = mode === m.id;
          return (
            <motion.button
              key={m.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => { setMode(m.id as VisualizerMode); onClose(); }}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 8, padding: '12px 12px 10px',
                borderRadius: 14,
                border: `1px solid ${isActive ? 'rgba(0,245,255,0.30)' : 'rgba(255,255,255,0.07)'}`,
                background: isActive ? 'rgba(0,245,255,0.08)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background .15s, border-color .15s',
              }}
            >
              {/* active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                }}>
                  <MdCheckCircle style={{ fontSize: 14, color: 'var(--accent-primary)' }} />
                </div>
              )}

              <span style={{ fontSize: 22, lineHeight: 1 }}>{m.icon}</span>

              <div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.80)',
                  lineHeight: 1.2, marginBottom: 3,
                }}>
                  {m.label}
                </div>
                <div style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.28)',
                  lineHeight: 1.35,
                }}>
                  {m.description}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
