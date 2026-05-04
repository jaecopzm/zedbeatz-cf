"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // The real scroll container is <main>, not window.
    // window.scrollY is always 0 in FBIAB since only <main> scrolls.
    const main = document.querySelector("main");
    if (!main) return;
    const handleScroll = () => {
      setShow(main.scrollTop > 400);
    };
    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    const main = document.querySelector("main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 z-30 w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg flex items-center justify-center text-white hover:bg-[var(--surface-hover)] hover:scale-110 active:scale-95 transition-all animate-scale-in"
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>
  );
}
