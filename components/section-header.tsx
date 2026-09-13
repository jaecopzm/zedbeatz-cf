import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="font-display text-[17px] md:text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-colors shrink-0">
          See all
          <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}
