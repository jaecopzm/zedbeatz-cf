"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main") as HTMLElement | null;
    const ua = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isInApp = /(FBAN|FBAV|Instagram|Line|MicroMessenger)/i.test(ua);
    const useDocumentScroll = isIOS && isInApp;
    const scroller = useDocumentScroll
      ? (document.scrollingElement as HTMLElement | null)
      : main;

    if (!scroller) return;

    const handleScroll = () => {
      setShow(scroller.scrollTop > 400);
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    const main = document.querySelector("main") as HTMLElement | null;
    const ua = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isInApp = /(FBAN|FBAV|Instagram|Line|MicroMessenger)/i.test(ua);
    const useDocumentScroll = isIOS && isInApp;
    const scroller = useDocumentScroll
      ? (document.scrollingElement as HTMLElement | null)
      : main;

    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: "smooth" });
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
