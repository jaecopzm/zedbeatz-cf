import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  const { data, error } = await supabase
    .from("artists")
    .select("id, name, slug, image_key, bio")
    .order("name")
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const artists = (data || []).map((artist) => ({
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    imageUrl: artist.image_key ? getPublicUrl(artist.image_key) : null,
    bio: artist.bio,
  }));

  return NextResponse.json(artists);
}
