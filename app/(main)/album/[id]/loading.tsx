import { Disc3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlbumLoading() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden mb-6">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/[0.04] via-black to-black" />

        <div className="px-4 md:px-8 pt-16 md:pt-20 pb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4 md:gap-5">
          <Skeleton className="w-36 h-36 md:w-48 md:h-48 shrink-0 flex items-center justify-center">
            <Disc3 size={32} className="text-foreground/10" />
          </Skeleton>

          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 md:h-10 w-64 md:w-96" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <section className="px-4 md:px-8 pb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </section>

      {/* Track list */}
      <section className="px-4 md:px-8">
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 md:gap-4 p-2"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Skeleton className="w-8 h-8 flex items-center justify-center shrink-0">
                <span className="text-xs text-foreground/10">{i + 1}</span>
              </Skeleton>
              <Skeleton className="w-10 h-10 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3.5 w-48 max-w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="w-4 h-4 shrink-0 hidden md:block" />
              <Skeleton className="w-10 h-3 shrink-0" />
              <Skeleton className="w-4 h-4 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

