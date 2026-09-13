import { db } from "@/lib/db/drizzle";
import { tracks } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

// Public global stats — no user auth.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [trackRow] = await db
    .select({ count: sql<number>`count(*)::int`, plays: sql<number>`coalesce(sum(${tracks.plays}),0)::int` })
    .from(tracks);
  return NextResponse.json({
    totalListeningTime: 0,
    totalPlays: trackRow?.plays ?? 0,
    totalTracks: trackRow?.count ?? 0,
    topTracks: [],
    topArtists: [],
  });
}
