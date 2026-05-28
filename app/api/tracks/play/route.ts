import { db } from "@/lib/db/drizzle";
import { tracks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await db.execute(sql`SELECT increment_plays(${Number(id)})`);
  } catch {
    const [data] = await db
      .select({ plays: tracks.plays })
      .from(tracks)
      .where(eq(tracks.id, Number(id)))
      .limit(1);
    await db
      .update(tracks)
      .set({ plays: (data?.plays ?? 0) + 1 })
      .where(eq(tracks.id, Number(id)));
  }

  return NextResponse.json({ ok: true });
}
