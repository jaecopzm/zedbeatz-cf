"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  ListPlus,
  Radio,
  Download,
  Heart,
} from "lucide-react";
import Link from "next/link";
import type { Track } from "@/lib/player-store";
import { useLikes } from "@/lib/likes-context";
import { showToast } from "@/components/toast";
import DownloadButton from "@/components/download-button";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useOutsideClick(refs: React.RefObject<HTMLElement | null>[], handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (refs.some((r) => r.current?.contains(e.target as Node))) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler]);
}

interface DropdownPosition {
  top: number;
  right: number;
  openUpward: boolean;
}

function useDropdownPosition(
  buttonRef: React.RefObject<HTMLButtonElement | null>,
  open: boolean,
  menuHeight = 280
) {
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    right: 0,
    openUpward: false,
  });

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    
    // Calculate immediately to avoid flash
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight + 8;

    setPosition({
      top: openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUpward,
    });
  }, [open]);

  return { ...position, setPosition };
}

// ─── Menu item definitions ────────────────────────────────────────────────────

type MenuAction =
  | { type: "link"; href: string }
  | { type: "button"; onClick: () => void }
  | { type: "component"; component: () => React.ReactElement };

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  action: MenuAction;
}

function useMenuItems(track: Track, onClose: () => void, copied: boolean, setCopied: (v: boolean) => void): MenuItem[] {
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(track.id);

  return useMemo(() => [
    {
      id: "view",
      label: "View Track",
      icon: ListPlus,
      iconColor: "#a78bfa",
      action: { type: "link" as const, href: `/track/${track.slug || track.id}` },
    },
    {
      id: "radio",
      label: "Go to Radio",
      icon: Radio,
      iconColor: "#34d399",
      action: { type: "link" as const, href: `/radio/${track.id}` },
    },
    {
      id: "download",
      label: "Download",
      icon: Download,
      iconColor: "#fbbf24",
      action: { 
        type: "component" as const, 
        component: () => (
          <DownloadButton 
            audioUrl={track.audioUrl} 
            title={track.title} 
            artist={track.artist}
            featuredArtists={track.featuredArtists}
            coverUrl={track.coverUrl} 
          />
        )
      },
    },
    {
      id: "like",
      label: liked ? "Remove from Liked Songs" : "Save to Liked Songs",
      icon: Heart,
      iconColor: "#f472b6",
      action: {
        type: "button" as const,
        onClick: async () => {
          await toggleLike(track.id);
          showToast(liked ? "Removed from Liked Songs" : "Added to Liked Songs ♥", liked ? "info" : "success");
          onClose();
        },
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [track, onClose, copied, setCopied, liked, toggleLike]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrackMenu({ track, onNavigate }: { track: Track; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  const closeAndNavigate = useCallback(() => {
    close();
    onNavigate?.();
  }, [close, onNavigate]);

  const items = useMenuItems(track, close, copied, setCopied);

  useOutsideClick([containerRef, dropdownRef], close);
  const { top, right, openUpward, setPosition } = useDropdownPosition(buttonRef, open, items.length * 48 + 8);

  // Close on scroll (delay to avoid closing on the scroll triggered by focus)
  useEffect(() => {
    if (!open) return;
    let active = false;
    const t = setTimeout(() => { active = true; }, 150);
    const handleScroll = () => { if (active) close(); };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [open, close]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          close();
          buttonRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((i) => (i + 1) % items.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((i) => (i - 1 + items.length) % items.length);
          break;
        case "Enter":
        case " ":
          if (focusedIndex >= 0) {
            e.preventDefault();
            itemRefs.current[focusedIndex]?.click();
          }
          break;
        case "Tab":
          close();
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close, focusedIndex, items.length]);

  // Focus item when index changes
  useEffect(() => {
    if (focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Focus first item when menu opens
  useEffect(() => {
    if (open) setFocusedIndex(0);
  }, [open]);

  const sharedItemProps = (item: MenuItem, index: number) => ({
    className: `track-menu-item item-${index}`,
    "data-focused": focusedIndex === index,
    onMouseEnter: () => setFocusedIndex(index),
    ref: (el: HTMLElement | null) => { itemRefs.current[index] = el; },
  });

  return (
    <div
      className="relative z-10"
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90 ${
          open 
            ? "bg-white/15 text-white" 
            : "bg-white/8 text-white/75 hover:text-white"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (!open && buttonRef.current) {
            // Calculate position immediately before opening
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpward = spaceBelow < 280;
            setPosition({
              top: openUpward ? rect.top - 280 - 4 : rect.bottom + 4,
              right: window.innerWidth - rect.right,
              openUpward,
            });
          }
          setOpen((v) => !v);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="More options"
      >
        <MoreHorizontal size={20} />
      </button>

      {open && createPortal(
        <>
          <style>{`
            @keyframes menuFadeIn {
              from {
                opacity: 0;
                transform: translateY(-4px) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
          <div
            ref={dropdownRef}
            className={`fixed z-[10000] min-w-[240px] bg-[#282828] rounded-lg p-1 shadow-2xl border border-white/10 ${
              openUpward ? "origin-bottom-right" : "origin-top-right"
            }`}
            style={{ 
              top: `${top}px`, 
              right: `${right}px`,
              animation: 'menuFadeIn 0.12s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            role="menu"
            aria-label="Track options"
            onClick={(e) => e.stopPropagation()}
          >
          {items.map((item, index) => {
            const Icon = item.icon;
            const isLink = item.action.type === "link";
            const isComponent = item.action.type === "component";
            const isDownload = item.id === "download";
            
            const className = `flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm font-medium text-white/90 hover:bg-white/10 transition-colors cursor-pointer ${
              focusedIndex === index ? "bg-white/10" : ""
            }`;

            const content = (
              <>
                <Icon size={18} style={{ color: item.iconColor }} className="shrink-0" />
                <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
              </>
            );

            if (isComponent && item.action.type === "component") {
              const Component = item.action.component;
              return (
                <div
                  key={item.id}
                  className={className}
                  role="menuitem"
                  tabIndex={-1}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Don't close menu immediately for component actions
                  }}
                >
                  <Icon size={18} style={{ color: item.iconColor }} className="shrink-0" />
                  <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                  <Component />
                </div>
              );
            }

            if (isLink) {
              return (
                <Link
                  key={item.id}
                  href={item.action.type === "link" ? item.action.href : "#"}
                  className={className}
                  role="menuitem"
                  tabIndex={-1}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeAndNavigate();
                  }}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                className={className}
                role="menuitem"
                tabIndex={-1}
                ref={(el) => { itemRefs.current[index] = el; }}
                onMouseEnter={() => setFocusedIndex(index)}
                onClick={(e) => {
                  e.stopPropagation();
                  (item.action as { type: "button"; onClick: () => void }).onClick();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
        </>
      , document.body)}
    </div>
  );
}