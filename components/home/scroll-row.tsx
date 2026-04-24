"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ScrollRow({ children, className = "", arrowTop = 70 }: { children: React.ReactNode; className?: string; arrowTop?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.75, behavior: "smooth" });
  }

  const arrowStyle = { top: `${arrowTop}px` };

  return (
    <div className="relative group/row px-4 md:px-8 md:mx-2">
      <div
        ref={ref}
        className={`flex gap-3 md:gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory ${className}`}
      >
        {children}
      </div>

      <button
        onClick={() => scroll(-1)}
        style={arrowStyle}
        className="hidden md:flex absolute left-0 z-10 w-9 h-9 items-center justify-center rounded-full bg-[var(--surface-2)]/90 backdrop-blur-md border border-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] opacity-0 group-hover/row:opacity-100 transition-all duration-200 hover:bg-[var(--surface-3)] hover:border-white/20 hover:scale-105"
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={() => scroll(1)}
        style={arrowStyle}
        className="hidden md:flex absolute right-0 z-10 w-9 h-9 items-center justify-center rounded-full bg-[var(--surface-2)]/90 backdrop-blur-md border border-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] opacity-0 group-hover/row:opacity-100 transition-all duration-200 hover:bg-[var(--surface-3)] hover:border-white/20 hover:scale-105"
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>

      <div className="absolute top-0 right-0 bottom-3 w-12 md:w-16 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
    </div>
  );
}
