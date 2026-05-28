import { db } from "@/lib/db/drizzle";
import { recentlyPlayed } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { track_id } = await req.json();

  if (!track_id) return NextResponse.json({ error: "Missing track_id" }, { status: 400 });

  const values: { trackId: number; userId?: string; playedAt: Date } = {
    trackId: track_id,
    playedAt: new Date(),
  };

  if (userId) {
    values.userId = userId;
  }

  await db.insert(recentlyPlayed).values(values);

  return NextResponse.json({ ok: true });
}
