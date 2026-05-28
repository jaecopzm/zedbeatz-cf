import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/drizzle";
import { follows, artists } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, sql } from "drizzle-orm";

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
      console.error("Count exception:", err);
      return NextResponse.json({ count: 0, error: String(err) });
    }
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (type === "check") {
    const artistId = req.nextUrl.searchParams.get("artist_id");
    const [data] = await db
      .select({ id: follows.id })
      .from(follows)
      .where(and(eq(follows.userId, userId), eq(follows.artistId, Number(artistId))))
      .limit(1);
    return NextResponse.json({ following: !!data });
  }

  const data = await db
    .select({
      artistId: follows.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
      artistImageKey: artists.imageKey,
    })
    .from(follows)
    .leftJoin(artists, eq(follows.artistId, artists.id))
    .where(eq(follows.userId, userId))
    .orderBy(desc(follows.createdAt));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, artist_id } = await req.json();

  if (!artist_id || typeof artist_id !== "number") {
    return NextResponse.json({ error: "Invalid artist_id" }, { status: 400 });
  }

  try {
    if (action === "follow") {
      const [existing] = await db
        .select({ id: follows.id })
        .from(follows)
        .where(and(eq(follows.userId, userId), eq(follows.artistId, artist_id)))
        .limit(1);

      if (existing) {
        return NextResponse.json({ success: true, message: "Already following" });
      }

      await db.insert(follows).values({ userId, artistId: artist_id });
    } else if (action === "unfollow") {
      await db
        .delete(follows)
        .where(and(eq(follows.userId, userId), eq(follows.artistId, artist_id)));
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.artistId, artist_id));

    return NextResponse.json({ success: true, count: result?.count ?? 0 });
  } catch (err) {
    console.error("Follow/unfollow exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
