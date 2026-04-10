"use client";

import { useEffect, useRef } from "react";

export default function AudioVisualizer({ audioRef, playing }: { audioRef: React.RefObject<HTMLAudioElement>; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const initializedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || initializedRef.current) return;
    
    // Wait for audio to have a source
    const checkSource = () => {
      if (!audio.src) {
        setTimeout(checkSource, 100);
        return;
      }

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 64;
        
        analyserRef.current = analyser;
        initializedRef.current = true;
      } catch (e) {
        return;
      }
    };

    checkSource();
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!playing || !analyser || !ctx || !canvas) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        const hue = (i / bufferLength) * 60 + 120;
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [playing]);

  return <canvas ref={canvasRef} width={200} height={40} className="opacity-60" />;
}
