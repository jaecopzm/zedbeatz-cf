import Link from "next/link";
import Image from "next/image";

export type RecentItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  coverUrl?: string | null;
  href: string;
};

export default function RecentGrid({ items }: { items: RecentItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-2">
      {items.slice(0, 8).map((item) => (
        <Link
          key={`${item.href}-${item.id}`}
          href={item.href}
          className="group flex items-center gap-2 md:gap-2.5 rounded overflow-hidden bg-white/[0.05] hover:bg-white/[0.1] ring-1 ring-white/[0.04] transition-all duration-200 active:scale-[0.99] min-h-[44px] md:min-h-[48px]"
        >
          <div className="relative w-11 h-11 md:w-12 md:h-12 shrink-0 bg-[var(--surface-3)]">
            {item.coverUrl && (
              <Image
                src={item.coverUrl}
                alt={item.title}
                fill
                sizes="52px"
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          <p className="text-[11px] md:text-[13px] font-semibold leading-tight line-clamp-2 pr-2 group-hover:text-[var(--primary)] transition-colors">
            {item.title}
          </p>
        </Link>
      ))}
    </div>
  );
}
