import { db } from "@/lib/db/drizzle";
import { tracks, artists } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { generateTrackSlug } from "@/lib/slugify";
import { requireAdmin } from "@/lib/require-admin";
import { eq, and, ilike, inArray, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req); if (deny) return deny;
  const { searchParams } = new URL(req.url);
  const artist_id = searchParams.get("artist_id");
  const title = searchParams.get("title");
  const artist_name = searchParams.get("artist_name");

  if (artist_name && title) {
    const matchedArtists = await db
      .select({ id: artists.id })
      .from(artists)
      .where(ilike(artists.name, artist_name.trim()))
      .limit(5);

    if (matchedArtists.length > 0) {
      const ids = matchedArtists.map(a => a.id);
      const data = await db
        .select({ id: tracks.id, title: tracks.title, artistName: artists.name })
        .from(tracks)
        .leftJoin(artists, eq(tracks.artistId, artists.id))
        .where(and(inArray(tracks.artistId, ids), ilike(tracks.title, title.trim())))
        .limit(1);
      return NextResponse.json(data);
    }
    return NextResponse.json([]);
  }

  if (artist_id && title) {
    const data = await db
      .select()
      .from(tracks)
      .where(and(eq(tracks.artistId, Number(artist_id)), ilike(tracks.title, title)))
      .limit(1);
    return NextResponse.json(data);
  }

  const data = await db.select().from(tracks).orderBy(desc(tracks.createdAt));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req); if (deny) return deny;
  const body = await req.json();

  delete body.featured;

  if (!body.slug && body.title && body.artist_id) {
    try {
      const [artist] = await db
        .select({ name: artists.name })
        .from(artists)
        .where(eq(artists.id, body.artist_id))
        .limit(1);

      if (artist) {
        body.slug = generateTrackSlug(artist.name, body.title);
      }
    } catch (e) {
      // Slug generation failed
    }
  }

  const [data] = await db.insert(tracks).values(body).returning();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req); if (deny) return deny;
  const { id, featured_artists, ...fields } = await req.json();

  if (featured_artists !== undefined && featured_artists) {
    const featuredNames = featured_artists
      .split(/[,&]|feat\.|ft\./)
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0);

    for (const name of featuredNames) {
      const [existing] = await db
        .select({ id: artists.id })
        .from(artists)
        .where(ilike(artists.name, name))
        .limit(1);

      if (!existing) {
        await db.insert(artists).values({ name });
      }
    }
  }

  const updateData = featured_artists !== undefined
    ? { ...fields, featuredArtists: featured_artists }
    : fields;

  await db.update(tracks).set(updateData).where(eq(tracks.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req); if (deny) return deny;
  const { id } = await req.json();
  await db.delete(tracks).where(eq(tracks.id, id));
  return NextResponse.json({ ok: true });
}
