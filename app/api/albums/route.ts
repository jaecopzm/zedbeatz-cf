import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error } = await supabase
    .from("albums")
    .select(`
      id,
      title,
      slug,
      cover_key,
      release_year,
      artist_id,
      artists(name, slug),
      tracks(id)
    `)
    .order("release_year", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const albums = (data || []).map((album) => ({
    id: album.id,
    title: album.title,
    slug: album.slug,
    artist: (album.artists as unknown as { name: string } | null)?.name ?? "Unknown",
    artistSlug: (album.artists as unknown as { slug: string } | null)?.slug,
    coverUrl: album.cover_key ? getPublicUrl(album.cover_key) : null,
    releaseYear: album.release_year,
    trackCount: (album.tracks as unknown as any[])?.length ?? 0,
  }));

  return NextResponse.json(albums);
}
