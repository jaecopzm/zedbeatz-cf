"use client";

export default function AudioVisualizer({ playing }: { playing: boolean }) {
  if (!playing) return null;

  return (
    <div className="flex items-end gap-1 h-10">
      {[1,2,3,4,5,6,7,8,9,10,11,12].map((i) => (
        <span
          key={i}
          className="rounded-full bg-gradient-to-t from-[var(--primary)] to-white shadow-[0_0_8px_rgba(30,215,96,0.6)]"
          style={{
            width: "3px",
            animationName: "bar-bounce",
            animationDuration: `${0.4 + (i % 4) * 0.15}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${i * 0.05}s`,
            height: `${10 + (i % 6) * 5}px`,
            transformOrigin: "bottom",
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}
