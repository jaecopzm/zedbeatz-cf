"use client";

import { useRef, useEffect, useState } from "react";

/**
 * Connects a Web Audio AnalyserNode to an existing <audio> element.
 * Returns a Uint8Array of frequency magnitudes (0-255) at 60fps when playing.
 * Falls back gracefully if Web Audio API is unavailable.
 */
export function useAudioAnalyser(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  playing: boolean,
  barCount: number = 32
): Uint8Array {
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    () => new Uint8Array(barCount)
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || typeof AudioContext === "undefined") return;

    // Lazily create AudioContext (must be triggered by user gesture)
    if (!contextRef.current) {
      try {
        contextRef.current = new AudioContext();
      } catch {
        return;
      }
    }

    const ctx = contextRef.current;

    // Create source node once — cannot be re-created for the same element
    if (!sourceRef.current) {
      try {
        sourceRef.current = ctx.createMediaElementSource(audio);
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = barCount * 4; // e.g. 128 for 32 bars
        analyserRef.current.smoothingTimeConstant = 0.8;
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } catch {
        return;
      }
    }

    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const analyser = analyserRef.current!;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      // Take the first barCount bins (bass-heavy part of spectrum is most reactive)
      setFrequencyData(new Uint8Array(dataArray.slice(0, barCount)));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, audioRef, barCount]);

  return frequencyData;
}
