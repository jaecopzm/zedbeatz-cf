"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { UserPlus, UserCheck } from "lucide-react";

export default function FollowButton({ artistId }: { artistId: number }) {
  const { isSignedIn } = useUser();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Get follower count
    fetch(`/api/follows?type=count&artist_id=${artistId}`)
      .then(r => r.json())
      .then(d => {
        console.log("Follower count response for artist", artistId, ":", d);
        // Handle both array and count response
        const actualCount = Array.isArray(d) ? d.length : (d.count || 0);
        setCount(actualCount);
      })
      .catch(err => {
        console.error("Count fetch error:", err);
        setCount(0);
      });

    // Check if user is following
    if (!isSignedIn) return;
    fetch(`/api/follows?type=check&artist_id=${artistId}`)
      .then(r => r.json())
      .then(d => {
        console.log("Following status:", d);
        setFollowing(d.following);
      });
  }, [artistId, isSignedIn]);

  async function toggle() {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    const action = following ? "unfollow" : "follow";
    const previousFollowing = following;
    const previousCount = count;
    
    // Optimistic update
    setFollowing(!following);
    setCount(prev => action === "follow" ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, artist_id: artistId }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        console.error("Follow API error:", data);
        throw new Error(data.error || "Failed to update");
      }
      
      // Update with actual count from server
      if (typeof data.count === "number") {
        setCount(data.count);
      }
      
      console.log("Follow action successful:", action);
    } catch (error) {
      console.error("Follow error:", error);
      // Revert on error
      setFollowing(previousFollowing);
      setCount(previousCount);
    } finally {
      setLoading(false);
    }
  }

  const formatCount = (num: number) => {
    if (!num || isNaN(num)) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/20 hover:bg-white/10 text-white font-semibold transition-all text-xs">
          <UserPlus size={13} /> Follow · {formatCount(count)}
        </button>
      </SignInButton>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold border transition-all text-xs ${
        following
          ? "bg-white/5 border-white/20 hover:bg-white/10 text-white"
          : "bg-[var(--primary)] border-transparent hover:bg-[var(--primary-hover)] text-black"
      }`}
    >
      {following ? (
        <><UserCheck size={13} /> Following · {formatCount(count)}</>
      ) : (
        <><UserPlus size={13} /> Follow · {formatCount(count)}</>
      )}
    </button>
  );
}
