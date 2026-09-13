"use client";

import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";

// Public follower count display. Follow/unfollow removed with user auth.
export default function FollowButton({ artistId }: { artistId: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`/api/follows?type=count&artist_id=${artistId}`)
      .then(r => r.json())
      .then(d => {
        const actualCount = Array.isArray(d) ? d.length : (d.count || 0);
        setCount(actualCount);
      })
      .catch(() => setCount(0));
  }, [artistId]);

  const formatCount = (num: number) => {
    if (!num || isNaN(num)) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <span className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--glass-hover)] border border-[var(--border-strong)] text-foreground font-semibold text-xs">
      <UserPlus size={13} /> {formatCount(count)} fans
    </span>
  );
}
