"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: number;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export default function TrackComments({ trackId }: { trackId: number }) {
  const { isSignedIn, user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/comments?track_id=${trackId}`)
      .then((r) => r.json())
      .then((d) => { setComments(d.comments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [trackId]);

  async function handleSubmit() {
    if (!input.trim() || submitting) return;
    setSubmitting(true);

    // Optimistic update
    const optimistic: Comment = {
      id: Date.now(),
      user_id: user?.id ?? "",
      user_name: user?.firstName ?? user?.username ?? "You",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);
    setInput("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId, content: optimistic.content }),
      });
      const data = await res.json();
      if (data.comment) {
        // Replace optimistic with real data
        setComments((prev) => prev.map((c) => (c.id === optimistic.id ? data.comment : c)));
      }
    } catch {
      // Revert on error
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="text-[var(--primary)]" size={20} />
        <h2 className="text-lg font-bold text-foreground">Comments</h2>
        {!loading && (
          <span className="text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {/* Input */}
      {isSignedIn ? (
        <div className="flex gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-[var(--primary-dim)] flex items-center justify-center text-[var(--primary)] text-xs font-bold shrink-0 mt-1">
            {(user.firstName ?? user.username ?? "U")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
              placeholder="Share your thoughts on this track..."
              maxLength={500}
              rows={2}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)]/60 focus:bg-[var(--surface-3)] resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-[var(--muted)]">{input.length}/500</span>
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || submitting}
                className="flex items-center gap-2 px-4 py-1.5 bg-[var(--primary)] text-black text-xs font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Send size={12} />
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--glass-border)] mb-6">
          <MessageCircle size={20} className="text-[var(--muted)] shrink-0" />
          <p className="text-sm text-[var(--muted)] flex-1">Sign in to leave a comment</p>
          <SignInButton mode="modal">
            <button className="px-4 py-1.5 bg-[var(--primary)] text-black text-xs font-bold rounded-full hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </SignInButton>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[var(--surface-2)] rounded w-1/4" />
                <div className="h-3 bg-[var(--surface-2)] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-[var(--muted)]">
          <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="flex gap-3 group/comment"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--primary)] text-xs font-bold shrink-0">
                  {comment.user_name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{comment.user_name}</span>
                    <span className="text-[10px] text-[var(--muted)]">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed break-words">{comment.content}</p>
                </div>
                {user && comment.user_id === user.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="shrink-0 p-1.5 text-[var(--muted)] hover:text-red-400 opacity-0 group-hover/comment:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </section>
  );
}
