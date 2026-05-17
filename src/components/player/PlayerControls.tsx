'use client';

import { motion } from 'framer-motion';
import {
  MdPlayArrow, MdPause, MdSkipNext, MdSkipPrevious,
  MdShuffle, MdRepeat, MdRepeatOne,
  MdVolumeUp, MdVolumeOff, MdVolumeMute,
  MdQueueMusic, MdTune, MdFullscreen, MdFullscreenExit,
  MdFavorite, MdFavoriteBorder, MdMusicNote,
} from 'react-icons/md';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useState, useCallback } from 'react';
import clsx from 'clsx';

/* ── helpers ─────────────────────────────────────────────────── */
function fmt(s: number) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

/* ── Cover art placeholder ───────────────────────────────────── */
function CoverArt({ title, size = 44 }: { title?: string; size?: number }) {
  const letter = title?.charAt(0).toUpperCase() ?? '♪';
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 10, flexShrink: 0,
        background: title
          ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
          : 'rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: title ? '0 4px 16px var(--glow-primary)' : 'none',
        fontSize: size * 0.38, fontWeight: 800, color: title ? '#000' : 'rgba(255,255,255,0.2)',
        userSelect: 'none', fontFamily: 'var(--font-display)',
      }}
    >
      {title ? letter : <MdMusicNote style={{ fontSize: size * 0.5, color: 'rgba(255,255,255,0.2)' }} />}
    </div>
  );
}

/* ── Icon button ─────────────────────────────────────────────── */
function IBtn({
  onClick, children, active = false, size = 40, accent = false, disabled = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
  size?: number;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.84 }}
      onClick={disabled ? undefined : onClick}
      className={clsx('icon-btn', active && 'active')}
      style={{
        width: size, height: size,
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'default' : 'pointer',
        ...(accent ? {
          background: 'var(--btn-gradient)',
          boxShadow: '0 0 18px var(--glow-primary)',
          borderRadius: '50%',
          color: 'var(--btn-text)',
        } : {}),
      }}
    >
      {children}
    </motion.button>
  );
}

/* ── Progress bar ─────────────────────────────────────────────── */
function ProgressBar({ current, total, onSeek }: {
  current: number; total: number; onSeek: (t: number) => void;
}) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <span style={{
        fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)',
        minWidth: 32, textAlign: 'right',
      }}>
        {fmt(current)}
      </span>
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="range"
          min={0}
          max={total || 100}
          value={current}
          step={0.1}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          style={{
            width: '100%',
            background: `linear-gradient(to right, var(--accent-primary) ${pct}%, rgba(255,255,255,0.14) ${pct}%)`,
          }}
        />
      </div>
      <span style={{
        fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)',
        minWidth: 32,
      }}>
        {fmt(total)}
      </span>
    </div>
  );
}

/* ── Volume control ──────────────────────────────────────────── */
function VolumeRow({ volume, isMuted, onVolume, onToggleMute }: {
  volume: number; isMuted: boolean; onVolume: (v: number) => void; onToggleMute: () => void;
}) {
  const eff = isMuted ? 0 : volume;
  const Icon = eff === 0 ? MdVolumeOff : eff < 0.5 ? MdVolumeMute : MdVolumeUp;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 80 }}>
      <IBtn onClick={onToggleMute} size={34}>
        <Icon style={{ fontSize: 18 }} />
      </IBtn>
      <input
        type="range" min={0} max={1} step={0.01} value={eff}
        onChange={(e) => onVolume(parseFloat(e.target.value))}
        style={{
          flex: 1,
          background: `linear-gradient(to right, var(--accent-secondary) ${eff * 100}%, rgba(255,255,255,0.14) ${eff * 100}%)`,
        }}
      />
    </div>
  );
}

/* ── MAIN COMPONENT ──────────────────────────────────────────── */
interface Props {
  audioRef: React.RefObject<HTMLAudioElement>;
  onVolumeChange: (v: number) => void;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
}

export function PlayerControls({ onTogglePlay, onVolumeChange, onSeek }: Props) {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, isMuted, shuffle, repeat, isFullscreen,
    nextTrack, prevTrack, toggleShuffle, toggleRepeat,
    setIsMuted, setIsFullscreen, togglePlaylist, toggleCustomization,
  } = usePlayerStore();

  const [liked, setLiked] = useState(false);

  const handleLike = useCallback(() => setLiked(v => !v), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>

      {/* ── Row 1: Track info ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0 10px' }}>
        <CoverArt title={currentTrack?.title} size={44} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: '#fff',
            fontFamily: 'var(--font-display)',
            letterSpacing: '.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {currentTrack?.title ?? 'No track loaded'}
          </div>
          <div style={{
            fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {currentTrack?.artist ?? 'Upload a file to begin'}
          </div>
        </div>

        {/* Like button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleLike}
          className="icon-btn"
          style={{ color: liked ? '#ff4060' : 'rgba(255,255,255,0.25)', width: 36, height: 36 }}
        >
          {liked
            ? <MdFavorite style={{ fontSize: 20, color: '#ff4060' }} />
            : <MdFavoriteBorder style={{ fontSize: 20 }} />}
        </motion.button>
      </div>

      {/* ── Row 2: Progress bar ─────────────────────────────── */}
      <ProgressBar current={currentTime} total={duration} onSeek={onSeek} />

      {/* ── Row 3: Main controls ────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0 0',
      }}>

        {/* Left cluster: shuffle + prev + PLAY + next + repeat */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IBtn onClick={toggleShuffle} active={shuffle} size={36}>
            <MdShuffle style={{ fontSize: 18 }} />
          </IBtn>

          <IBtn onClick={prevTrack} size={36}>
            <MdSkipPrevious style={{ fontSize: 24 }} />
          </IBtn>

          {/* Play / Pause – primary action */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            whileHover={{ scale: 1.06 }}
            onClick={onTogglePlay}
            className={isPlaying ? 'beat' : ''}
            style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'var(--btn-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--btn-text)',
              boxShadow: isPlaying
                ? '0 0 24px var(--glow-primary), 0 4px 16px rgba(0,0,0,0.4)'
                : '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'box-shadow .3s ease',
              flexShrink: 0,
              margin: '0 2px',
            }}
          >
            {isPlaying
              ? <MdPause style={{ fontSize: 28 }} />
              : <MdPlayArrow style={{ fontSize: 30, marginLeft: 2 }} />}
          </motion.button>

          <IBtn onClick={nextTrack} size={36}>
            <MdSkipNext style={{ fontSize: 24 }} />
          </IBtn>

          <IBtn onClick={toggleRepeat} active={repeat !== 'none'} size={36}>
            {repeat === 'one'
              ? <MdRepeatOne style={{ fontSize: 18 }} />
              : <MdRepeat style={{ fontSize: 18 }} />}
          </IBtn>
        </div>

        {/* Right cluster: volume + queue + settings + fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <IBtn onClick={() => setIsMuted(!isMuted)} size={34}>
            {isMuted
              ? <MdVolumeOff style={{ fontSize: 18 }} />
              : <MdVolumeUp style={{ fontSize: 18 }} />}
          </IBtn>

          {/* Mini volume slider */}
          <input
            type="range" min={0} max={1} step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{
              width: 56,
              background: `linear-gradient(to right, var(--accent-secondary) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.14) ${(isMuted ? 0 : volume) * 100}%)`,
            }}
          />

          <IBtn onClick={togglePlaylist} size={34}>
            <MdQueueMusic style={{ fontSize: 18 }} />
          </IBtn>

          <IBtn onClick={toggleCustomization} size={34}>
            <MdTune style={{ fontSize: 18 }} />
          </IBtn>

          <IBtn onClick={() => setIsFullscreen(!isFullscreen)} size={34}>
            {isFullscreen
              ? <MdFullscreenExit style={{ fontSize: 20 }} />
              : <MdFullscreen style={{ fontSize: 20 }} />}
          </IBtn>
        </div>
      </div>
    </div>
  );
}
