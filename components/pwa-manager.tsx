"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PwaManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          function (registration) {
            console.log("ServiceWorker registration successful with scope: ", registration.scope);
          },
          function (err) {
            console.log("ServiceWorker registration failed: ", err);
          }
        );
      });
      setIsSupported(true);
    }

    // Detect if already installed / standalone
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      return; // Already installed, do nothing
    }

    // Check if user previously dismissed banner
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed === "true") {
      return;
    }

    // iOS Detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // iOS doesn't fire beforeinstallprompt. Show our custom banner.
      setTimeout(() => setShowInstallBanner(true), 2000);
    }

    // Android / Desktop beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // We can't auto-install on iOS, so the banner already tells them what to do.
      return;
    }
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setShowInstallBanner(false);
      } else {
        console.log("User dismissed the install prompt");
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!isSupported) return null;

  return (
    <AnimatePresence>
      {showInstallBanner && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-4 right-4 z-[999] md:top-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[400px] bg-[var(--surface)] border border-[var(--glass-border)] shadow-2xl rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[#0d732f] flex items-center justify-center shrink-0">
            <Download className="text-white" size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white mb-0.5">Install ZedBeatz</h4>
            {isIOS ? (
              <p className="text-xs text-[var(--muted)] leading-tight">
                Tap <span className="inline-block mx-0.5 border border-white/20 rounded px-1">Share</span> then <strong>Add to Home Screen</strong> for a full-screen experience.
              </p>
            ) : (
              <p className="text-xs text-[var(--muted)] leading-tight">
                Get the app for a faster, full-screen offline experience.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {!isIOS && (
              <button 
                onClick={handleInstallClick}
                className="bg-[var(--primary)] text-black text-xs font-bold px-3 py-1.5 rounded-full hover:scale-105 active:scale-95 transition-transform"
              >
                Install
              </button>
            )}
            <button 
              onClick={handleDismiss}
              className="text-[var(--muted)] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
