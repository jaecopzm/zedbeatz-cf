import Link from "next/link";
import { slugify } from "@/lib/slugify";
import { Flame, Mic2, Church, Music, Music2, Drum, Headphones, Radio } from "lucide-react";

const iconMap: Record<string, typeof Flame> = {
  pop: Music,
  hip: Mic2,
  dance: Music2,
  rnb: Music,
  "r&b": Music,
  gospel: Church,
  afro: Flame,
  dunka: Drum,
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {genres.map((label) => {
        const { Icon, color } = matchGenre(label);
        return (
          <Link
            key={label}
            href={`/genre/${slugify(label)}`}
            className="relative h-20 rounded-xl overflow-hidden flex items-end p-3 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(135deg, ${color}cc, ${color}77)` }}
          >
            <Icon size={22} className="absolute top-3 right-3 text-white/70" />
            <span className="text-white font-black text-sm drop-shadow">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
