import { create } from "zustand";

export type Track = {
  id: number;
  title: string;
  artist: string;
  artistId?: number;
  artistSlug?: string;
  featuredArtists?: string;
  audioUrl: string;
  coverUrl?: string;
  duration?: number;
  slug?: string;
  createdAt?: string;
};

export type PlayContext = {
  label: string;   // e.g. "Liked Songs", "Yo Maps Radio", "New Releases"
  href?: string;   // optional link back to the source
};

type PlayerState = {
  queue: Track[];
  currentIndex: number;
  playing: boolean;
  loading: boolean;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  currentTrack: Track | null;
  context: PlayContext | null;
  setQueue: (tracks: Track[], startIndex?: number, context?: PlayContext | null) => void;
  play: (track: Track, context?: PlayContext | null) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setLoading: (loading: boolean) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  playing: false,
  loading: false,
  shuffle: false,
  repeat: "off",
  context: null,
  get currentTrack() { const s = get(); return s.queue[s.currentIndex] ?? null; },

  setQueue: (tracks, startIndex = 0, context = null) => {
    set({ queue: tracks, currentIndex: startIndex, playing: true, loading: true, context: context ?? null });
  },
  play: (track, context = null) => {
    set({ queue: [track], currentIndex: 0, playing: true, loading: true, context: context ?? null });
  },
  toggle: () => set((s) => ({ playing: !s.playing })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () => set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),
  setLoading: (loading) => set({ loading }),

  reorderQueue: (fromIndex, toIndex) => set((s) => {
    const newQueue = [...s.queue];
    const [removed] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, removed);
    // Adjust currentIndex to follow the currently playing track
    let newIndex = s.currentIndex;
    if (fromIndex === s.currentIndex) {
      newIndex = toIndex;
    } else if (fromIndex < s.currentIndex && toIndex >= s.currentIndex) {
      newIndex = s.currentIndex - 1;
    } else if (fromIndex > s.currentIndex && toIndex <= s.currentIndex) {
      newIndex = s.currentIndex + 1;
    }
    return { queue: newQueue, currentIndex: newIndex };
  }),

  next: () => {
    const { queue, currentIndex, shuffle, repeat } = get();
    if (repeat === "one") return;
    let nextIndex = currentIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (currentIndex < queue.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (repeat === "all") {
      nextIndex = 0;
    }
    set({ currentIndex: nextIndex, playing: true, loading: true });
  },

  prev: () => {
    const { currentIndex, queue } = get();
    set({ currentIndex: Math.max(currentIndex - 1, 0), playing: true, loading: true });
  },
}));
