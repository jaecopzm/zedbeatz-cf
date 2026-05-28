import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { tracks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [data] = await db
    .select({ id: tracks.id, plays: tracks.plays })
    .from(tracks)
    .where(eq(tracks.id, Number(id)))
    .limit(1);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  await db
    .update(tracks)
    .set({ featuredArtists: body.featured_artists })
    .where(eq(tracks.id, Number(id)));
  return NextResponse.json({ success: true });
}
