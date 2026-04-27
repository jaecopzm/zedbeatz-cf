"use client";

import { useAudioAnalyser } from "@/lib/use-audio-analyser";

const BAR_COUNT = 32;

interface Props {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playing: boolean;
  /** Visual height of the container in px */
  height?: number;
  /** Number of bars to render */
  barCount?: number;
  className?: string;
}

export default function AudioVisualizer({
  audioRef,
  playing,
  height = 48,
  barCount = BAR_COUNT,
  className = "",
}: Props) {
  const { frequencyData } = useAudioAnalyser(audioRef, playing, barCount);

  if (!playing) return null;

  const hasData = frequencyData.some((v) => v > 0);

  return (
    <div
      className={`flex items-end gap-[2px] ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const raw = frequencyData[i] ?? 0;
        // Normalize 0-255 → min 8% - max 100% of container height
        const pct = hasData ? Math.max(0.08, raw / 255) : 0.08 + 0.1 * Math.sin(Date.now() / 300 + i);
        const barH = Math.round(pct * height);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: "3px",
              height: `${barH}px`,
              borderRadius: "2px",
              background: `linear-gradient(to top, var(--primary), ${
                raw > 200 ? "#fff" : raw > 128 ? "#a0f0c0" : "var(--primary)"
              })`,
              boxShadow: raw > 100 ? `0 0 6px rgba(30,215,96,${raw / 512})` : "none",
              transition: "height 0.05s ease-out",
              transformOrigin: "bottom",
            }}
          />
        );
      })}
    </div>
  );
}
