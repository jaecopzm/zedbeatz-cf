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
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
}
