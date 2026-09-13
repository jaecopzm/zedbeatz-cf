 "use client";

import Link from "next/link";
import { slugify } from "@/lib/slugify";
import { Flame, Microphone, Church, MusicNote, MusicNotes, Guitar, Headphones, Radio } from "@phosphor-icons/react";

const iconMap: Record<string, typeof Flame> = {
  pop: MusicNote,
  hip: Microphone,
  dance: MusicNotes,
  rnb: MusicNote,
  "r&b": MusicNote,
  gospel: Church,
  afro: Flame,
  dunka: Guitar,
  zed: Headphones,
};

const colorMap: Record<string, string> = {
  pop: "#e91e8c",
  hip: "#1e88e5",
  dance: "#10b981",
  rnb: "#8b5cf6",
  "r&b": "#8b5cf6",
  gospel: "#f59e0b",
  afro: "#ff6b35",
  dunka: "#ec4899",
  zed: "#06b6d4",
};

function matchGenre(label: string) {
  const lower = label.toLowerCase();
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (lower.includes(keyword)) return { Icon: icon, color: colorMap[keyword] };
  }
  return { Icon: Radio, color: "#6366f1" };
}

export default function GenresMoods({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0">
      {genres.map((label) => {
        const { Icon } = matchGenre(label);
        return (
          <Link
            key={label}
            href={`/genre/${slugify(label)}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl px-3.5 py-2 text-[13px] font-semibold text-foreground/80 hover:bg-[var(--primary)] hover:text-black hover:border-transparent hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all"
          >
            <Icon size={14} weight="bold" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
