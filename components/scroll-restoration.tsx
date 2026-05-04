"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    // Use document scrolling on small screens, main scrolling on desktop.
    // FBIAB behaves like a mobile browser, so keeping the page as the
    // primary scroll surface avoids the one-direction lock.
    const main = document.querySelector("main") as HTMLElement | null;
    const useDocumentScroll = window.matchMedia("(max-width: 1023px)").matches;
    const scroller = useDocumentScroll
      ? (document.scrollingElement as HTMLElement | null)
      : main;

    if (scroller) scroller.scrollTop = 0;
  }, [pathname]);

  return null;
}
