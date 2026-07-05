import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/drizzle";
import { playlists, playlistTracks, tracks, savedPlaylists } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { getCoverUrl } from "@/lib/cdn";
import { eq, and, isNull, desc, asc, sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function enrichPlaylists(rows: any[]) {
  return rows.map((p) => ({
    ...p,
    cover_url: getCoverUrl({ coverKey: p.coverKey })
      ?? (p.firstCoverKey ? getCoverUrl({ coverKey: p.firstCoverKey }) : null),
  }));
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const searchParams = new URL(req.url).searchParams;
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  async function fetchPlaylists(whereCondition?: any) {
    let query = db
      .select({
        id: playlists.id,
        name: playlists.name,
        coverKey: playlists.coverKey,
        isFeatured: playlists.isFeatured,
        category: playlists.category,
        createdAt: playlists.createdAt,
        firstCoverKey: sql<string>`
          (SELECT ${tracks.coverKey} FROM ${playlistTracks} pt
           LEFT JOIN ${tracks} ON ${tracks.id} = pt.track_id
           WHERE pt.playlist_id = ${playlists.id}
           ORDER BY pt.position
           LIMIT 1)
        `,
        trackCount: sql<number>`
          (SELECT count(*)::int FROM ${playlistTracks} pt2 WHERE pt2.playlist_id = ${playlists.id})
        `,
      })
      .from(playlists);

    if (whereCondition) {
      query = query.where(whereCondition) as any;
    }

    return await query
      .orderBy(desc(playlists.createdAt))
      .limit(limit)
      .offset(offset) as any;
  }

  if (type === "admin") {
    const data = await fetchPlaylists(isNull(playlists.userId));
    return NextResponse.json(await enrichPlaylists(data));
  }

  if (type === "user" && userId) {
    const data = await fetchPlaylists(eq(playlists.userId, userId));
    return NextResponse.json(await enrichPlaylists(data));
  }

  if (type === "user") {
    return NextResponse.json([]);
  }

  if (type === "saved" && userId) {
    const data = await db
      .select({
        id: playlists.id,
        name: playlists.name,
        coverKey: playlists.coverKey,
        isFeatured: playlists.isFeatured,
        category: playlists.category,
        createdAt: playlists.createdAt,
        firstCoverKey: sql<string>`
          (SELECT ${tracks.coverKey} FROM ${playlistTracks} pt
           LEFT JOIN ${tracks} ON ${tracks.id} = pt.track_id
           WHERE pt.playlist_id = ${playlists.id}
           ORDER BY pt.position
           LIMIT 1)
        `,
        trackCount: sql<number>`
          (SELECT count(*)::int FROM ${playlistTracks} pt2 WHERE pt2.playlist_id = ${playlists.id})
        `,
      })
      .from(savedPlaylists)
      .leftJoin(playlists, eq(savedPlaylists.playlistId, playlists.id))
      .where(eq(savedPlaylists.userId, userId))
      .orderBy(desc(playlists.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(await enrichPlaylists(data));
  }

  if (type === "saved") {
    return NextResponse.json([]);
  }

  const data = await fetchPlaylists();
  return NextResponse.json(await enrichPlaylists(data));
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "save") {
    await db
      .insert(savedPlaylists)
      .values({ userId, playlistId: body.playlist_id })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true });
  }

  if (body.action === "unsave") {
    await db
      .delete(savedPlaylists)
      .where(and(eq(savedPlaylists.userId, userId), eq(savedPlaylists.playlistId, body.playlist_id)));
    return NextResponse.json({ ok: true });
  }

  const insertData = body.is_admin
    ? { name: body.name, userId: null, category: body.category || null, isFeatured: body.is_featured ?? true }
    : { name: body.name, userId };

  const [data] = await db.insert(playlists).values(insertData).returning();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();

  const [playlist] = await db
    .select({ userId: playlists.userId })
    .from(playlists)
    .where(eq(playlists.id, id))
    .limit(1);

  if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  if (playlist.userId && playlist.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.update(playlists).set(fields).where(eq(playlists.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  const [playlist] = await db
    .select({ userId: playlists.userId })
    .from(playlists)
    .where(eq(playlists.id, id))
    .limit(1);

  if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  if (playlist.userId && playlist.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(playlists).where(eq(playlists.id, id));
  return NextResponse.json({ ok: true });
}
