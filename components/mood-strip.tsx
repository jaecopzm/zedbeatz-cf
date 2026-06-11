"use client";

import Link from "next/link";
import { Waves, Flame, PartyPopper, Brain, Dumbbell, Heart } from "lucide-react";

const moods = [
  { id: "chill", name: "Chill", icon: Waves },
  { id: "hype", name: "Hype", icon: Flame },
  { id: "party", name: "Party", icon: PartyPopper },
  { id: "focus", name: "Focus", icon: Brain },
  { id: "workout", name: "Workout", icon: Dumbbell },
  { id: "romance", name: "Romance", icon: Heart },
];

export default function MoodStrip() {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
      {moods.map((mood) => {
        const Icon = mood.icon;
        return (
          <Link
            key={mood.id}
            href={`/genre/${mood.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] transition-all border border-[var(--border)] whitespace-nowrap group"
          >
            <Icon size={16} className="text-[var(--muted)] group-hover:text-foreground transition-colors" />
            <span className="text-sm font-medium">{mood.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
