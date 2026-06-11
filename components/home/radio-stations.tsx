import Link from "next/link";
import Image from "next/image";
import { Radio } from "lucide-react";

export type RadioStation = {
  id: number;
  title: string;
  artist: string;
  artistSlug: string | null;
  coverUrl: string | null;
  slug: string | null;
  name: string;
};

export default function RadioStations({ stations }: { stations: RadioStation[] }) {
  if (stations.length === 0) return null;

  return stations.map((station) => (
    <Link
      key={station.id}
      href={`/radio/${station.slug || station.id}`}
      className="group flex-shrink-0 w-[140px] md:w-[176px] snap-start"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-[var(--surface-3)] mb-2.5 shadow-lg ring-1 ring-white/5 group-hover:ring-[var(--primary)]/40 transition-all duration-400 rounded-lg">
        {station.coverUrl ? (
          <Image
            src={station.coverUrl}
            alt={`${station.name} Radio`}
            fill
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-600"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center">
            <Radio size={32} className="text-[var(--muted)]/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[var(--primary)]/90 text-[9px] font-bold text-black uppercase tracking-wider">
          Radio
        </div>
      </div>
      <p className="text-xs md:text-sm font-bold truncate group-hover:text-[var(--primary)] transition-colors">
        {station.name} Radio
      </p>
    </Link>
  ));
}
