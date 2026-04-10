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

type PlayerState = {
  queue: Track[];
  currentIndex: number;
  playing: boolean;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  currentTrack: Track | null;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  play: (track: Track) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  playing: false,
  shuffle: false,
  repeat: "off",
  get currentTrack() { const s = get(); return s.queue[s.currentIndex] ?? null; },

  setQueue: (tracks, startIndex = 0) => {
    set({ queue: tracks, currentIndex: startIndex, playing: true });
  },
  play: (track) => {
    set({ queue: [track], currentIndex: 0, playing: true });
  },
  toggle: () => set((s) => ({ playing: !s.playing })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () => set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),

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
    set({ currentIndex: nextIndex, playing: true });
  },

  prev: () => {
    const { currentIndex, queue } = get();
    set({ currentIndex: Math.max(currentIndex - 1, 0), playing: true });
  },
}));
