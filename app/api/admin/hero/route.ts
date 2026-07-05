import { db } from "@/lib/db/drizzle";
import { heroTracks, tracks, artists } from "@/lib/db/schema";
import { getAudioUrl, getCoverUrl } from "@/lib/cdn";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeFeaturedArtists } from "@/lib/featured-artists";
import { requireAdmin } from "@/lib/require-admin";
import { eq, asc, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function mapTrack(r: any) {
  return {
    id: r.trackId2,
    title: r.title,
    artistId: r.artistId,
    artist: r.artistName ?? "Unknown",
    artistSlug: r.artistSlug,
    featuredArtists: sanitizeFeaturedArtists(r.featuredArtists),
    audioUrl: getAudioUrl({ audioKey: r.audioKey }) ?? "",
    coverUrl: getCoverUrl({ coverKey: r.coverKey }),
    duration: r.duration,
    slug: r.slug,
  };
}

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny;
  const data = await db
    .select({
      trackId: heroTracks.trackId,
      position: heroTracks.position,
      trackId2: tracks.id,
      title: tracks.title,
      audioKey: tracks.audioKey,
      coverKey: tracks.coverKey,
      duration: tracks.duration,
      slug: tracks.slug,
      featuredArtists: tracks.featuredArtists,
      artistId: tracks.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(heroTracks)
    .leftJoin(tracks, eq(heroTracks.trackId, tracks.id))
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .orderBy(asc(heroTracks.position));

  return NextResponse.json((data ?? []).map(mapTrack));
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { track_id } = await req.json();
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(heroTracks);
  await db
    .insert(heroTracks)
    .values({ trackId: track_id, position: countResult?.count ?? 0 })
    .onConflictDoNothing({ target: heroTracks.trackId });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { track_id } = await req.json();
  await db.delete(heroTracks).where(eq(heroTracks.trackId, track_id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { order } = await req.json();
  await Promise.all(
    order.map(({ track_id, position }: { track_id: number; position: number }) =>
      db.update(heroTracks).set({ position }).where(eq(heroTracks.trackId, track_id))
    )
  );
  return NextResponse.json({ ok: true });
}
