"use client";

import { useRef, useEffect, useState } from "react";

/**
 * Connects a Web Audio AnalyserNode to an existing <audio> element.
 * Returns frequency data AND a GainNode for proper volume control.
 */
export function useAudioAnalyser(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  playing: boolean,
  barCount: number = 32
): { frequencyData: Uint8Array; gainNode: GainNode | null } {
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    () => new Uint8Array(barCount)
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || typeof AudioContext === "undefined") return;

    // Lazily create AudioContext
    if (!contextRef.current) {
      try {
        contextRef.current = new AudioContext();
      } catch {
        return;
      }
    }

    const ctx = contextRef.current;

    // Create audio graph once: source → gain → analyser → destination
    if (!sourceRef.current) {
      try {
        sourceRef.current = ctx.createMediaElementSource(audio);
        gainNodeRef.current = ctx.createGain();
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = barCount * 4;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        // Connect: source → gain → analyser → destination
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } catch {
        return;
      }
    }

    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const analyser = analyserRef.current!;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      setFrequencyData(new Uint8Array(dataArray.slice(0, barCount)));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, audioRef, barCount]);

  return { frequencyData, gainNode: gainNodeRef.current };
}
