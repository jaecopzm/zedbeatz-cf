import { db } from "@/lib/db/drizzle";
import { recentlyPlayed } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Anonymous play logging — no user auth.
export async function POST(req: NextRequest) {
  const { track_id } = await req.json();

  if (!track_id) return NextResponse.json({ error: "Missing track_id" }, { status: 400 });

  await db.insert(recentlyPlayed).values({ trackId: track_id, playedAt: new Date() });

  return NextResponse.json({ ok: true });
}
