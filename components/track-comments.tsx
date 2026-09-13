"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: number;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

function CommentItem({ comment, userId, onDelete }: { comment: Comment; userId?: string; onDelete: (id: number) => void }) {
  const touchRef = useRef<{ x: number } | null>(null);
  const [swiped, setSwiped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: swiped ? -120 : -16 }}
      className="flex gap-3 group/comment relative overflow-hidden"
      onTouchStart={(e) => { touchRef.current = { x: e.touches[0].clientX }; }}
      onTouchMove={(e) => {
        if (!touchRef.current) return;
        const dx = touchRef.current.x - e.touches[0].clientX;
        if (dx > 50 && userId && comment.user_id === userId) setSwiped(true);
        else if (dx < -20) setSwiped(false);
      }}
      onTouchEnd={() => { touchRef.current = null; }}
    >
      {/* Delete action revealed on swipe */}
      {userId && comment.user_id === userId && (
        <button
          onClick={() => onDelete(comment.id)}
          className={`absolute right-0 top-0 bottom-0 flex items-center justify-center w-20 bg-red-500/20 text-red-400 transition-all duration-200 ${
            swiped ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Trash2 size={16} />
        </button>
      )}
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
      {userId && comment.user_id === userId && (
        <button
          onClick={() => onDelete(comment.id)}
          className="shrink-0 p-1.5 text-[var(--muted)] hover:text-red-400 opacity-0 group-hover/comment:opacity-100 transition-all hidden md:block"
        >
          <Trash2 size={13} />
        </button>
      )}
    </motion.div>
  );
}

export default function TrackComments({ trackId }: { trackId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/comments?track_id=${trackId}`)
      .then((r) => r.json())
      .then((d) => { setComments(d.comments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [trackId]);

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

      <div className="flex items-center gap-4 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--glass-border)] mb-6">
        <MessageCircle size={20} className="text-[var(--muted)] shrink-0" />
        <p className="text-sm text-[var(--muted)] flex-1">Comments are read-only while we scale up.</p>
      </div>

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
              <CommentItem key={comment.id} comment={comment} onDelete={handleDelete} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </section>
  );
}
