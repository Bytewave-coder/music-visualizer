'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdLayers, MdCloudUpload } from 'react-icons/md';

import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useVisualizerStore } from '@/store/useVisualizerStore';

import { VisualizerScene } from './visualizer/VisualizerScene';
import { PlayerControls } from './player/PlayerControls';
import { FileUploader } from './ui/FileUploader';
import { Playlist } from './ui/Playlist';
import { VisualizerSelector } from './ui/VisualizerSelector';
import { CustomizationPanel } from './ui/CustomizationPanel';
import { SplashScreen } from './ui/SplashScreen';
import { Theme } from '@/types';

export default function MusicVisualizer() {
  const analyzer = useAudioAnalyzer();
  const {
    currentTrack, isPlaying, volume, isMuted,
    setIsPlaying, setCurrentTime, setDuration, setVolume,
    nextTrack, showPlaylist, showCustomization,
    isFullscreen, togglePlaylist, toggleCustomization,
  } = usePlayerStore();

  const { mode, theme, setTheme, ...settings } = useVisualizerStore();

  const [splashDone, setSplashDone] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [playerVisible, setPlayerVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Apply theme class ─────────────────────────────────────── */
  useEffect(() => {
    document.body.className = theme === 'cosmic' ? '' : `theme-${theme}`;
  }, [theme]);

  /* ── Sync track ────────────────────────────────────────────── */
  useEffect(() => {
    if (!currentTrack || !analyzer.audioRef.current) return;
    analyzer.connectSource(currentTrack.url);
    analyzer.audioRef.current.load();
    if (isPlaying) {
      analyzer.initAudio().then(() => analyzer.audioRef.current?.play().catch(() => {}));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  /* ── Sync play/pause ───────────────────────────────────────── */
  useEffect(() => {
    if (!analyzer.audioRef.current) return;
    if (isPlaying) {
      analyzer.initAudio().then(() => analyzer.audioRef.current?.play().catch(() => {}));
    } else {
      analyzer.audioRef.current.pause();
    }
  }, [isPlaying]);

  /* ── Sync volume ───────────────────────────────────────────── */
  useEffect(() => {
    if (analyzer.audioRef.current) {
      analyzer.audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTogglePlay = useCallback(async () => {
    await analyzer.initAudio();
    setIsPlaying(!isPlaying);
  }, [isPlaying, analyzer, setIsPlaying]);

  const handleSeek = useCallback((t: number) => {
    if (analyzer.audioRef.current) {
      analyzer.audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  }, [analyzer, setCurrentTime]);

  const handleVolumeChange = useCallback((v: number) => setVolume(v), [setVolume]);
  const handleThemeChange  = useCallback((t: Theme) => setTheme(t), [setTheme]);

  /* ── Auto-hide player in fullscreen ────────────────────────── */
  const showPlayer = useCallback(() => {
    setPlayerVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (isFullscreen) {
      hideTimer.current = setTimeout(() => setPlayerVisible(false), 3000);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      hideTimer.current = setTimeout(() => setPlayerVisible(false), 3000);
    } else {
      setPlayerVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isFullscreen]);

  /* ── Close mode selector when another panel opens ─────────── */
  useEffect(() => {
    if (showPlaylist || showCustomization) setShowModeSelector(false);
  }, [showPlaylist, showCustomization]);

  const visualizerSettings = {
    mode, theme, ...settings,
    sensitivity: settings.sensitivity,
    particleIntensity: settings.particleIntensity,
    glowIntensity: settings.glowIntensity,
    colorScheme: settings.colorScheme,
    bloomStrength: settings.bloomStrength,
    showGrid: settings.showGrid,
    cameraAutoRotate: settings.cameraAutoRotate,
    fxaaEnabled: settings.fxaaEnabled,
  };

  const panelVisible = showPlaylist || showCustomization;

  return (
    <div
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: 'var(--bg-primary)' }}
      onMouseMove={showPlayer}
      onTouchStart={showPlayer}
    >
      {/* Hidden audio element */}
      <audio
        ref={analyzer.audioRef}
        onTimeUpdate={() => setCurrentTime(analyzer.audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(analyzer.audioRef.current?.duration ?? 0)}
        onEnded={nextTrack}
        crossOrigin="anonymous"
      />

      {/* 3D canvas – full background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <VisualizerScene audio={analyzer} mode={mode} settings={visualizerSettings} />
      </div>

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute', inset: '0 0 auto 0', height: 100, pointerEvents: 'none', zIndex: 10,
        background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 'auto 0 0 0', height: 180, pointerEvents: 'none', zIndex: 10,
        background: 'linear-gradient(to top, rgba(5,5,20,0.97) 0%, transparent 100%)',
      }} />

      {/* ── Top bar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {(!isFullscreen || playerVisible) && (
          <motion.div
            key="topbar"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px 0',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'var(--btn-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: 'var(--btn-text)',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 0 14px var(--glow-primary)',
              }}>
                A
              </div>
              <span style={{
                fontSize: 18, fontWeight: 800, color: '#fff',
                fontFamily: 'var(--font-display)', letterSpacing: '.04em',
              }}>
                AURA
              </span>
            </div>

            {/* Top actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Mode selector toggle */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowModeSelector(!showModeSelector)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: showModeSelector ? 'rgba(0,245,255,0.14)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${showModeSelector ? 'rgba(0,245,255,0.28)' : 'rgba(255,255,255,0.10)'}` as never,
                  color: showModeSelector ? 'var(--accent-primary)' : 'rgba(255,255,255,0.60)',
                  fontSize: 13, fontWeight: 500,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <MdLayers style={{ fontSize: 18 }} />
                <span>Modes</span>
              </motion.button>

              {/* Upload */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowUploader(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)' as never,
                  color: 'rgba(255,255,255,0.60)',
                  fontSize: 13, fontWeight: 500,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <MdCloudUpload style={{ fontSize: 18 }} />
                <span>Upload</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mode selector dropdown ────────────────────────── */}
      <AnimatePresence>
        {showModeSelector && (
          <motion.div
            key="modes"
            initial={{ opacity: 0, y: 8, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: .97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
            style={{
              position: 'absolute', top: 68, right: 16, zIndex: 40, width: 280,
            }}
          >
            <VisualizerSelector onClose={() => setShowModeSelector(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Side panels (playlist / customize) ───────────── */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            key="playlist"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            style={{
              position: 'absolute', top: 68, right: 16, bottom: 140, zIndex: 40, width: 288,
            }}
          >
            <Playlist onClose={togglePlaylist} onUploadClick={() => setShowUploader(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomization && (
          <motion.div
            key="customize"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            style={{
              position: 'absolute', top: 68, right: 16, bottom: 140, zIndex: 40, width: 288,
            }}
          >
            <CustomizationPanel onClose={toggleCustomization} onThemeChange={handleThemeChange} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Player bar ───────────────────────────────────── */}
      <AnimatePresence>
        {(!isFullscreen || playerVisible) && (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
              padding: '0 12px 12px',
            }}
          >
            <div
              className="player-card"
              style={{
                maxWidth: 680, margin: '0 auto',
                borderRadius: 20,
                padding: '14px 16px 12px',
              }}
            >
              <PlayerControls
                audioRef={analyzer.audioRef}
                onTogglePlay={handleTogglePlay}
                onVolumeChange={handleVolumeChange}
                onSeek={handleSeek}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Welcome / empty state ────────────────────────── */}
      <AnimatePresence>
        {!currentTrack && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ textAlign: 'center', pointerEvents: 'auto' }}>
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}
              >
                ♪
              </motion.div>
              <p style={{
                color: 'rgba(255,255,255,0.30)', fontSize: 14, marginBottom: 20,
                fontFamily: 'var(--font-display)',
              }}>
                Upload music to begin your journey
              </p>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowUploader(true)}
                className="btn-primary"
                style={{ fontSize: 15, padding: '13px 28px' }}
              >
                <MdCloudUpload style={{ fontSize: 20 }} />
                Upload Audio Files
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── File uploader modal ──────────────────────────── */}
      <AnimatePresence>
        {showUploader && (
          <FileUploader onClose={() => setShowUploader(false)} />
        )}
      </AnimatePresence>

      {/* ── Splash screen ────────────────────────────────── */}
      <AnimatePresence>
        {!splashDone && (
          <SplashScreen onComplete={() => setSplashDone(true)} />
        )}
      </AnimatePresence>
    </div>
  );
}
