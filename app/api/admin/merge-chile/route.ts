import { db } from "@/lib/db/drizzle";
import { artists, tracks } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { eq, or, inArray } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const deny = await requireAdmin(); if (deny) return deny;
  try {
    const matchedArtists = await db
      .select({ id: artists.id, name: artists.name, slug: artists.slug })
      .from(artists)
      .where(or(eq(artists.name, "Chile One"), eq(artists.name, "Chile One Mr Zambia")));

    if (matchedArtists.length === 0) {
      return NextResponse.json({ error: 'No artists found' });
    }

    if (matchedArtists.length === 1) {
      return NextResponse.json({ message: 'Only one artist found, no merge needed', artist: matchedArtists[0] });
    }

    const keep = matchedArtists.find(a => a.name === 'Chile One Mr Zambia')!;
    const remove = matchedArtists.find(a => a.name === 'Chile One')!;

    const updated = await db
      .update(tracks)
      .set({ artistId: keep.id })
      .where(eq(tracks.artistId, remove.id))
      .returning({ id: tracks.id, title: tracks.title });

    await db.delete(artists).where(eq(artists.id, remove.id));

    return NextResponse.json({
      success: true,
      kept: keep.name,
      removed: remove.name,
      tracksUpdated: updated.length,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
