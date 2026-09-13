"use client";
import { useRef, useState, useEffect } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

export default function ScrollRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollState() {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, []);

  function scroll(dir: 1 | -1) {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.75, behavior: "smooth" });
  }

  return (
    <div className="relative group/row px-4 md:px-6">
      <div
        ref={ref}
        className={`flex gap-2 md:gap-2.5 overflow-x-auto pb-1.5 scrollbar-hide snap-x snap-mandatory ${className}`}
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-12 items-center justify-center rounded-[4px] bg-[var(--glass)] backdrop-blur-2xl border border-[var(--glass-border)] text-foreground shadow-2xl opacity-0 group-hover/row:opacity-100 hover:bg-[var(--glass-hover)] hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Scroll left"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-12 items-center justify-center rounded-[4px] bg-[var(--glass)] backdrop-blur-2xl border border-[var(--glass-border)] text-foreground shadow-2xl opacity-0 group-hover/row:opacity-100 hover:bg-[var(--glass-hover)] hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Scroll right"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      )}
    </div>
  );
}
