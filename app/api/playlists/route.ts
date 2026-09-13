import { db } from "@/lib/db/drizzle";
import { playlists, playlistTracks, tracks } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { getCoverUrl } from "@/lib/cdn";
import { desc, sql } from "drizzle-orm";

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
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
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
    .from(playlists)
    .orderBy(desc(playlists.createdAt))
    .limit(limit)
    .offset(offset);
  return NextResponse.json(await enrichPlaylists(data as any));
}

export async function POST() { return NextResponse.json({ error: "User playlists are paused" }, { status: 410 }); }
export async function PATCH() { return NextResponse.json({ error: "User playlists are paused" }, { status: 410 }); }
export async function DELETE() { return NextResponse.json({ error: "User playlists are paused" }, { status: 410 }); }
