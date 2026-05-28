import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny;
  const checks = {
    database: { status: "unknown", details: {} },
    endpoints: { status: "unknown", details: {} },
  };

  try {
    const trackResult = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        artistId: tracks.artistId,
        audioKey: tracks.audioKey,
        coverKey: tracks.coverKey,
        genre: tracks.genre,
        featuredArtists: tracks.featuredArtists,
        slug: tracks.slug,
      })
      .from(tracks)
      .limit(1);

    checks.database.status = "ok";
    checks.database.details = {
      message: "All required columns exist",
      columns: ["id", "title", "artist_id", "audio_key", "cover_key", "genre", "featured_artists", "slug"],
    };

    const artistResult = await db
      .select({ id: artists.id, name: artists.name })
      .from(artists)
      .limit(1);

    checks.endpoints.status = "ok";
    checks.endpoints.details = {
      message: "Artists endpoint working",
      sample_count: artistResult.length,
    };

    const allOk = checks.database.status === "ok" && checks.endpoints.status === "ok";

    return NextResponse.json({
      ready: allOk,
      message: allOk ? "Agent upload is ready!" : "Some checks failed",
      checks,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ready: false,
        message: "Setup check failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
