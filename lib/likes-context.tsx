"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type LikesContextType = {
  likedIds: Set<number>;
  toggleLike: (trackId: number) => Promise<void>;
  isLiked: (trackId: number) => boolean;
};

const LikesContext = createContext<LikesContextType>({
  likedIds: new Set(),
  toggleLike: async () => {},
  isLiked: () => false,
});

const KEY = "zedbeatz-likes";

export function LikesProvider({ children }: { children: ReactNode }) {
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLikedIds(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  async function toggleLike(trackId: number) {
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(trackId) ? next.delete(trackId) : next.add(trackId);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
    window.dispatchEvent(new CustomEvent("likesChanged", { detail: { trackId } }));
  }

  function isLiked(trackId: number) {
    return likedIds.has(trackId);
  }

  return (
    <LikesContext.Provider value={{ likedIds, toggleLike, isLiked }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  return useContext(LikesContext);
}
