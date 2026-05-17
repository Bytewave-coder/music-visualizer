'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MdMusicNote, MdDelete, MdPlayArrow, MdClose, MdAdd } from 'react-icons/md';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types';
import clsx from 'clsx';

function fmt(s: number) {
  if (!s || !isFinite(s)) return '--:--';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

function TrackRow({ track, index, isActive }: { track: Track; index: number; isActive: boolean }) {
  const { setCurrentTrack, removeTrack, setIsPlaying } = usePlayerStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.025, duration: .25 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px',
        borderRadius: 12,
        cursor: 'pointer',
        background: isActive ? 'rgba(0,245,255,0.08)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(0,245,255,0.15)' : 'transparent'}`,
        transition: 'background .15s, border-color .15s',
        marginBottom: 2,
      }}
      onClick={() => { setCurrentTrack(track); setIsPlaying(true); }}
    >
      {/* Index / active indicator */}
      <div style={{ width: 22, textAlign: 'center', flexShrink: 0 }}>
        {isActive ? (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{
              width: 8, height: 8, borderRadius: '50%', margin: '0 auto',
              background: 'var(--accent-primary)',
              boxShadow: '0 0 6px var(--glow-primary)',
            }}
          />
        ) : (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>{index + 1}</span>
        )}
      </div>

      {/* Cover letter */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 14,
        background: isActive
          ? 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))'
          : 'rgba(255,255,255,0.07)',
        color: isActive ? 'var(--btn-text)' : 'rgba(255,255,255,0.35)',
        fontFamily: 'var(--font-display)',
      }}>
        {track.title.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.70)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {track.title}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
          {track.artist}
        </div>
      </div>

      {/* Duration */}
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
        {fmt(track.duration)}
      </span>

      {/* Remove */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
        style={{
          width: 28, height: 28, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.20)',
          opacity: 0, transition: 'opacity .15s, color .15s',
          flexShrink: 0,
        }}
        className="track-del"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          (e.currentTarget as HTMLButtonElement).style.color = '#ff4060';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '0';
        }}
      >
        <MdDelete style={{ fontSize: 16 }} />
      </button>
    </motion.div>
  );
}

interface Props { onClose: () => void; onUploadClick: () => void; }

export function Playlist({ onClose, onUploadClick }: Props) {
  const { playlist, currentTrack } = usePlayerStore();

  return (
    <div className="side-panel" style={{ height: '100%' }}>
      {/* Header */}
      <div className="panel-header">
        <div>
          <span className="panel-title">Playlist</span>
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.28)', marginLeft: 8,
            fontFamily: 'var(--font-mono)',
          }}>
            {playlist.length} track{playlist.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onUploadClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 12px', borderRadius: 10,
              background: 'rgba(0,245,255,0.08)',
              border: '1px solid rgba(0,245,255,0.18)',
              color: 'var(--accent-primary)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <MdAdd style={{ fontSize: 16 }} /> Add
          </button>
          <button className="panel-close" onClick={onClose}>
            <MdClose style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Track list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 16px' }}>
        {playlist.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 16, padding: '40px 0',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MdMusicNote style={{ fontSize: 26, color: 'rgba(255,255,255,0.18)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>No tracks yet</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>Tap + Add to upload music</p>
            </div>
            <button
              type="button"
              onClick={onUploadClick}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: 13 }}
            >
              Upload Audio Files
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {playlist.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} isActive={currentTrack?.id === track.id} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
