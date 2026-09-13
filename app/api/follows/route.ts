import { db } from "@/lib/db/drizzle";
import { follows } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

// Follower counts stay public. Follow/unfollow removed with user auth.
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  if (type === "count") {
    const artistId = req.nextUrl.searchParams.get("artist_id");
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(follows)
        .where(eq(follows.artistId, Number(artistId)));

      return NextResponse.json({ count: result?.count ?? 0 });
    } catch (err) {
      return NextResponse.json({ count: 0, error: String(err) });
    }
  }

  if (type === "check") {
    return NextResponse.json({ following: false });
  }

  return NextResponse.json([]);
}

export async function POST() {
  return NextResponse.json({ error: "Follows are paused" }, { status: 410 });
}
