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
    <div className="relative group/row px-4 md:px-6">
      <div
        ref={ref}
        className={`flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory ${className}`}
      >
        {children}
      </div>

      <button
        onClick={() => scroll(-1)}
        style={arrowStyle}
        className="hidden md:flex absolute left-2 z-10 w-8 h-8 items-center justify-center bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:bg-black"
        aria-label="Scroll left"
      >
        <ChevronLeft size={14} />
      </button>

      <button
        onClick={() => scroll(1)}
        style={arrowStyle}
        className="hidden md:flex absolute right-2 z-10 w-8 h-8 items-center justify-center bg-black/80 text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:bg-black"
        aria-label="Scroll right"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
