import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { artists } from "@/lib/db/schema";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const data = await db
    .select({
      id: artists.id,
      name: artists.name,
      slug: artists.slug,
      imageKey: artists.imageKey,
      bio: artists.bio,
    })
    .from(artists)
    .limit(1000);

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

  const sorted = data.sort((a, b) => {
    const aIndex = priority.indexOf(a.name);
    const bIndex = priority.indexOf(b.name);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(sorted);
}
