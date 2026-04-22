"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ScrollRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.75, behavior: "smooth" });
  }

  return (
    <div className="relative group/row px-4 md:px-8">
      <div
        ref={ref}
        className={`flex gap-3 md:gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory ${className}`}
      >
        {children}
      </div>

      {/* Left arrow - overlaid on content */}
      <button
        onClick={() => scroll(-1)}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-black/80 backdrop-blur-sm border border-white/20 text-white shadow-xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:bg-black/90 hover:scale-110"
        aria-label="Scroll left"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Right arrow - overlaid on content */}
      <button
        onClick={() => scroll(1)}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-black/80 backdrop-blur-sm border border-white/20 text-white shadow-xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:bg-black/90 hover:scale-110"
        aria-label="Scroll right"
      >
        <ChevronRight size={20} />
      </button>

      {/* Fade right edge only */}
      <div className="absolute top-0 right-0 bottom-3 w-12 md:w-16 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
    </div>
  );
}
