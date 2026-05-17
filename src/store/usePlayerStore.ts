import { create } from 'zustand';
import { Track, PlayerState } from '@/types';

interface PlayerStore extends PlayerState {
  setCurrentTrack: (track: Track | null) => void;
  setPlaylist: (tracks: Track[]) => void;
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  reorderPlaylist: (from: number, to: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  togglePlaylist: () => void;
  toggleCustomization: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  playlist: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  shuffle: false,
  repeat: 'none',
  isFullscreen: false,
  showPlaylist: false,
  showCustomization: false,

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setPlaylist: (tracks) => set({ playlist: tracks }),

  addTrack: (track) =>
    set((state) => ({
      playlist: [...state.playlist, track],
      currentTrack: state.currentTrack ?? track,
    })),

  removeTrack: (id) =>
    set((state) => {
      const playlist = state.playlist.filter((t) => t.id !== id);
      const currentTrack =
        state.currentTrack?.id === id ? playlist[0] ?? null : state.currentTrack;
      return { playlist, currentTrack };
    }),

  reorderPlaylist: (from, to) =>
    set((state) => {
      const list = [...state.playlist];
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return { playlist: list };
    }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

  setIsMuted: (isMuted) => set({ isMuted }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleRepeat: () =>
    set((state) => ({
      repeat:
        state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none',
    })),

  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),

  togglePlaylist: () => set((state) => ({ showPlaylist: !state.showPlaylist })),

  toggleCustomization: () =>
    set((state) => ({ showCustomization: !state.showCustomization })),

  nextTrack: () => {
    const { playlist, currentTrack, shuffle, repeat } = get();
    if (!playlist.length) return;
    if (repeat === 'one') {
      set({ currentTime: 0 });
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack?.id);
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    set({ currentTrack: playlist[nextIndex], currentTime: 0 });
  },

  prevTrack: () => {
    const { playlist, currentTrack, currentTime } = get();
    if (!playlist.length) return;
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    set({ currentTrack: playlist[prevIndex], currentTime: 0 });
  },
}));
