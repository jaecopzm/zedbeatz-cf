import { db } from "@/lib/db/drizzle";
import { recentlyPlayed } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { track_id } = await req.json();

  if (!track_id) return NextResponse.json({ error: "Missing track_id" }, { status: 400 });

  const playedAt = new Date();

  if (userId) {
    await db.insert(recentlyPlayed)
      .values({ trackId: track_id, userId, playedAt })
      .onConflictDoUpdate({
        target: [recentlyPlayed.userId, recentlyPlayed.trackId],
        set: { playedAt },
      });
  } else {
    await db.insert(recentlyPlayed).values({ trackId: track_id, playedAt });
  }

  return NextResponse.json({ ok: true });
}
