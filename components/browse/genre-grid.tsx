"use client";

import Link from "next/link";
import { slugify } from "@/lib/slugify";

const colors = [
  "from-red-600 to-red-400",
  "from-orange-600 to-amber-400",
  "from-amber-600 to-yellow-400",
  "from-green-600 to-emerald-400",
  "from-teal-600 to-cyan-400",
  "from-blue-600 to-sky-400",
  "from-indigo-600 to-violet-400",
  "from-purple-600 to-pink-400",
  "from-pink-600 to-rose-400",
  "from-rose-700 to-red-500",
  "from-emerald-700 to-green-500",
  "from-cyan-700 to-blue-500",
];

export default function GenreGrid({ genres }: { genres: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
      {genres.map((genre, i) => (
        <Link
          key={genre}
          href={`/genre/${slugify(genre)}`}
          className={`aspect-[3/2] rounded bg-gradient-to-br ${colors[i % colors.length]} p-3 md:p-4 flex items-end transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
        >
          <span className="text-sm md:text-base font-bold text-foreground drop-shadow-sm leading-tight">{genre}</span>
        </Link>
      ))}
    </div>
  );
}