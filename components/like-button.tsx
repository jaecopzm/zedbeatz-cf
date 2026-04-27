"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useLikes } from "@/lib/likes-context";
import { showToast } from "@/components/toast";

export default function LikeButton({ trackId, size = 18 }: { trackId: number; size?: number }) {
  const { isSignedIn } = useUser();
  const { isLiked, toggleLike } = useLikes();
  const [loading, setLoading] = useState(false);
  const [popping, setPopping] = useState(false);
  
  const liked = isLiked(trackId);

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading || !isSignedIn) return;
    
    if ('vibrate' in navigator) navigator.vibrate(10);
    setLoading(true);
    const wasLiked = liked;
    if (!wasLiked) { setPopping(true); setTimeout(() => setPopping(false), 400); }
    
    await toggleLike(trackId);
    showToast(wasLiked ? "Removed from Liked Songs" : "Added to Liked Songs ♥", wasLiked ? "info" : "success");
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      aria-label={liked ? "Unlike track" : "Like track"}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
        liked
          ? "text-[var(--primary)] bg-[var(--primary-dim)]"
          : "text-[var(--muted)] hover:text-white bg-transparent hover:bg-[var(--glass-hover)]"
      } ${popping ? "animate-heart-pop" : ""}`}
    >
      <Heart size={size} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 1.8} className="transition-all duration-200" />
    </button>
  );
}
