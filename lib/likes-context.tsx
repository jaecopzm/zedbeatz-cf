"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

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

export function LikesProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser();
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/likes")
      .then(r => r.json())
      .then(d => setLikedIds(new Set(d.likedIds || [])))
      .catch(() => {});
  }, [isSignedIn]);

  async function toggleLike(trackId: number) {
    const newLiked = !likedIds.has(trackId);
    
    // Optimistic update
    setLikedIds(prev => {
      const next = new Set(prev);
      newLiked ? next.add(trackId) : next.delete(trackId);
      return next;
    });

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId }),
      });
      const data = await res.json();
      
      // Confirm with server
      setLikedIds(prev => {
        const next = new Set(prev);
        data.liked ? next.add(trackId) : next.delete(trackId);
        return next;
      });

      // Notify other components
      window.dispatchEvent(new CustomEvent('likesChanged', { detail: { trackId, liked: data.liked } }));
    } catch {
      // Revert on error
      setLikedIds(prev => {
        const next = new Set(prev);
        newLiked ? next.delete(trackId) : next.add(trackId);
        return next;
      });
    }
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
