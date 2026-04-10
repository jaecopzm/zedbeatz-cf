"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Music2, Mic2, Disc3, Radio, Headphones, Guitar, Drum, Piano } from "lucide-react";

const genreColors = [
  { from: "from-emerald-500", to: "to-teal-600", color: "#10b981" },
  { from: "from-rose-500", to: "to-pink-600", color: "#f43f5e" },
  { from: "from-purple-500", to: "to-indigo-600", color: "#8b5cf6" },
  { from: "from-orange-500", to: "to-amber-600", color: "#f59e0b" },
  { from: "from-blue-500", to: "to-cyan-600", color: "#3b82f6" },
  { from: "from-yellow-400", to: "to-orange-500", color: "#facc15" },
  { from: "from-cyan-400", to: "to-blue-500", color: "#22d3ee" },
  { from: "from-indigo-600", to: "to-purple-700", color: "#4f46e5" },
];

const genreIcons = [Music2, Mic2, Disc3, Radio, Headphones, Guitar, Drum, Piano];

export default function GenreGrid({ genres }: { genres: string[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
      {genres.map((genre, i) => {
        const color = genreColors[i % genreColors.length];
        const Icon = genreIcons[i % genreIcons.length];

        return (
          <motion.div
            key={genre}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              href={`/search?q=${encodeURIComponent(genre)}`}
              className={`group relative block aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br ${color.from} ${color.to} p-2.5 md:p-4 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}
              style={{
                boxShadow: `0 8px 20px -8px ${color.color}40`,
              }}
            >
              {/* Glassmorphic overlay */}
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] opacity-20 transition-opacity group-hover:opacity-0" />
              
              {/* Animated Background Decoration */}
              <div className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-20 h-20 md:w-32 md:h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-between z-10">
                <h3 className="text-xs md:text-xl font-bold text-white leading-tight drop-shadow-md">
                  {genre}
                </h3>
                
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="self-end drop-shadow-2xl"
                >
                  <Icon
                    size={24}
                    className="text-white/40 group-hover:text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 md:w-10 md:h-10"
                    strokeWidth={1.5}
                  />
                </motion.div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
