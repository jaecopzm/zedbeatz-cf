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
    .from("artists")
    .select("id, name, slug, image_key, bio")
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Priority Zambian artists
  const priority = [
    "Yo Maps",
    "Chile One Mr Zambia",
    "Chef 187",
    "Slapdee",
    "Macky 2",
    "Kell Kay",
    "Dizmo",
    "Drifta Trek",
    "Bobby East",
    "Jay Rox",
  ];

  const sorted = (data || []).sort((a, b) => {
    const aIndex = priority.indexOf(a.name);
    const bIndex = priority.indexOf(b.name);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const paginated = sorted.slice(offset, offset + limit);
  const artists = paginated.map((artist) => ({
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    imageUrl: artist.image_key ? getPublicUrl(artist.image_key) : null,
    bio: artist.bio,
  }));

  return NextResponse.json(artists);
}
