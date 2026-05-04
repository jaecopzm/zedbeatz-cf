"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll the main scrollable container on route change.
    // NOTE: Do NOT set history.scrollRestoration = "manual" here —
    // FBIAB (Facebook in-app browser) maintains its own scroll state,
    // and overriding it desyncs the browser's tracked scroll position
    // from the actual container position, blocking upward scroll.
    // NOTE: Do NOT call window.scrollTo() here either — same reason.
    const main = document.querySelector("main");
    const root = document.documentElement;
    const ua = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isInApp = /(FBAN|FBAV|Instagram|Line|MicroMessenger)/i.test(ua);
    const useDocumentScroll = isIOS && isInApp;

    root.classList.toggle("inapp-ios", useDocumentScroll);

    const scroller = useDocumentScroll
      ? (document.scrollingElement as HTMLElement | null)
      : (main as HTMLElement | null);

    if (scroller) scroller.scrollTop = 0;
  }, [pathname]);

  return null;
}
