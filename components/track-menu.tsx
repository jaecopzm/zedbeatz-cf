"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  ListPlus,
  Radio,
  Download,
  Heart,
  Link2,
} from "lucide-react";
import Link from "next/link";
import type { Track } from "@/lib/player-store";
import { useLikes } from "@/lib/likes-context";
import { showToast } from "@/components/toast";
import DownloadButton from "@/components/download-button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";

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
    {
      id: "copy",
      label: "Copy Link",
      icon: Link2,
      iconColor: "#60a5fa",
      action: {
        type: "button" as const,
        onClick: () => {
          const url = `${window.location.origin}/track/${track.slug || track.id}`;
          navigator.clipboard.writeText(url);
          showToast("Link copied!", "success");
          onClose();
        },
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [track, onClose, copied, setCopied, liked, toggleLike]);
}

// ─── Shared menu content ──────────────────────────────────────────────────────

function MenuContent({
  items,
  track,
  close,
  closeAndNavigate,
  setFocusedIndex,
  itemRefs,
  focusedIndex,
}: {
  items: MenuItem[];
  track: Track;
  close: () => void;
  closeAndNavigate: () => void;
  setFocusedIndex: (f: number) => void;
  itemRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  focusedIndex: number;
}) {
  return (
    <>
      {/* Track info header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[var(--border)]">
        {track.coverUrl && (
          <img src={track.coverUrl} alt={track.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-foreground truncate leading-tight">{track.title}</p>
          <p className="text-[11px] text-[var(--muted)] truncate">{track.artist}</p>
        </div>
      </div>

      {/* Items */}
      <div className="py-1">
        {items.map((item, index) => {
          const Icon = item.icon;

          const commonClass = `track-menu-item flex items-center gap-3 w-full px-3 py-2 text-[13px] font-medium text-foreground cursor-pointer`;

          if (item.action.type === "component") {
            const Component = item.action.component;
            return (
              <div key={item.id} className={commonClass} role="menuitem" tabIndex={-1}
                ref={(el) => { itemRefs.current[index] = el; }}
                onMouseEnter={() => setFocusedIndex(index)}
                data-focused={focusedIndex === index}
                onClick={() => close()}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: `${item.iconColor}22` }}>
                  <Icon size={16} style={{ color: item.iconColor }} />
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                <Component />
              </div>
            );
          }

          if (item.action.type === "link") {
            return (
              <Link key={item.id} href={item.action.href}
                className={commonClass} role="menuitem" tabIndex={-1}
                ref={(el) => { itemRefs.current[index] = el; }}
                onMouseEnter={() => setFocusedIndex(index)}
                data-focused={focusedIndex === index}
                onClick={(e) => { e.stopPropagation(); closeAndNavigate(); }}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: `${item.iconColor}22` }}>
                  <Icon size={16} style={{ color: item.iconColor }} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <button key={item.id}
              className={commonClass} role="menuitem" tabIndex={-1}
              ref={(el) => { itemRefs.current[index] = el; }}
              onMouseEnter={() => setFocusedIndex(index)}
              data-focused={focusedIndex === index}
              onClick={(e) => { e.stopPropagation(); if (item.action.type === "button") item.action.onClick(); }}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: `${item.iconColor}22` }}>
                <Icon size={16} style={{ color: item.iconColor }} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrackMenu({ track, onNavigate }: { track: Track; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const isMobile = useIsMobile();

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

  // Close on scroll (desktop only)
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
    if (open) {
      const id = setTimeout(() => setFocusedIndex(0), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  return (
    <div
      className="relative z-10"
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        className="flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-90 text-[var(--muted)] hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          if (!open && buttonRef.current) {
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

      {/* Mobile: Bottom Sheet Drawer */}
      {isMobile && (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerTitle>
              <VisuallyHidden>Track options</VisuallyHidden>
            </DrawerTitle>
            <div className="p-4 pb-8">
              <MenuContent
                items={items}
                track={track}
                close={close}
                closeAndNavigate={closeAndNavigate}
                setFocusedIndex={setFocusedIndex}
                itemRefs={itemRefs}
                focusedIndex={focusedIndex}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Desktop: Floating dropdown portal */}
      {open && createPortal(
        <>
          <style>{`
            @keyframes menuIn {
              from { opacity: 0; transform: scale(0.95) translateY(-6px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            .track-menu-dropdown { animation: menuIn 0.15s cubic-bezier(0.16,1,0.3,1) forwards; }
            .track-menu-item { transition: background 0.1s; }
            .track-menu-item:hover, .track-menu-item[data-focused="true"] { background: var(--surface-hover); }
          `}</style>

          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-[9999]" onClick={close} />

          <div
            ref={dropdownRef}
            className={`track-menu-dropdown fixed z-[10000] w-[260px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)] border border-[var(--border)] hidden lg:block ${openUpward ? "origin-bottom-right" : "origin-top-right"}`}
            aria-label="Track options"
            style={{
              top: `${top}px`,
              right: `${right}px`,
              background: "var(--surface)",
              borderRadius: "14px",
            }}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuContent
              items={items}
              track={track}
              close={close}
              closeAndNavigate={closeAndNavigate}
              setFocusedIndex={setFocusedIndex}
              itemRefs={itemRefs}
              focusedIndex={focusedIndex}
            />
          </div>
        </>
      , document.body)}
    </div>
  );
}
