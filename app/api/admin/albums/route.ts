import { db } from "@/lib/db/drizzle";
import { albums, artists } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req); if (deny) return deny;
  const data = await db
    .select({
      id: albums.id,
      title: albums.title,
      artistId: albums.artistId,
      releaseYear: albums.releaseYear,
      artistName: artists.name,
    })
    .from(albums)
    .leftJoin(artists, eq(albums.artistId, artists.id))
    .orderBy(desc(albums.createdAt));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req); if (deny) return deny;
  const body = await req.json();
  const [data] = await db.insert(albums).values(body).returning();
  return NextResponse.json(data);
}
