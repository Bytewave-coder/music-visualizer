'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdCloudUpload, MdMusicNote, MdCheckCircle } from 'react-icons/md';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types';

interface Props { onClose: () => void; }

function parseTrackMeta(file: File): Track {
  const name = file.name.replace(/\.[^.]+$/, '');
  const parts = name.split(' - ');
  const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
  const title  = parts.length > 1 ? parts.slice(1).join(' - ').trim() : name;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title, artist, duration: 0,
    url: URL.createObjectURL(file), file,
  };
}

export function FileUploader({ onClose }: Props) {
  const { addTrack } = usePlayerStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [added, setAdded] = useState<string[]>([]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const audio = Array.from(files).filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|flac|ogg|aac|m4a)$/i.test(f.name));
    audio.forEach((file) => {
      const track = parseTrackMeta(file);
      addTrack(track);
      setAdded((prev) => [...prev, track.title]);
    });
  }, [addTrack]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '0 16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        style={{
          width: '100%', maxWidth: 420,
          borderRadius: 22,
          background: 'rgba(8,8,28,0.98)',
          border: '1px solid rgba(255,255,255,0.11)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
              Add Music
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              MP3, WAV, FLAC, OGG, AAC supported
            </div>
          </div>
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
          >
            <MdClose style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Drop zone */}
        <div style={{ padding: '20px 20px 0' }}>
          <motion.div
            animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              borderRadius: 16, cursor: 'pointer',
              border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'rgba(255,255,255,0.13)'}`,
              background: isDragging ? 'rgba(0,245,255,0.04)' : 'rgba(255,255,255,0.02)',
              boxShadow: isDragging ? '0 0 30px rgba(0,245,255,0.10)' : 'none',
              padding: '36px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              transition: 'border-color .2s, background .2s, box-shadow .2s',
            }}
          >
            <motion.div
              animate={isDragging ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(0,245,255,0.08)',
                border: '1px solid rgba(0,245,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MdCloudUpload style={{ fontSize: 26, color: 'var(--accent-primary)' }} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                {isDragging ? 'Drop to add tracks' : 'Drag & drop audio files'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', marginTop: 4 }}>
                or tap to browse
              </div>
            </div>
          </motion.div>

          <input
            ref={inputRef} type="file" accept="audio/*" multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Added list */}
        <div style={{ padding: '0 20px 20px', marginTop: 16 }}>
          <AnimatePresence>
            {added.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}
              >
                <span className="section-label">Added ({added.length})</span>
                <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {added.map((title, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', borderRadius: 10,
                        background: 'rgba(0,245,255,0.06)',
                        border: '1px solid rgba(0,245,255,0.12)',
                      }}
                    >
                      <MdMusicNote style={{ fontSize: 14, color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                      </span>
                      <MdCheckCircle style={{ fontSize: 14, color: 'var(--accent-primary)', flexShrink: 0 }} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {added.length > 0 ? (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              className="btn-primary"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Start Listening
            </motion.button>
          ) : (
            <button
              type="button"
              className="btn-ghost"
              onClick={onClose}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 0', borderRadius: 12 }}
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
