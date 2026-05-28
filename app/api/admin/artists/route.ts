import { db } from "@/lib/db/drizzle";
import { artists } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { asc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny;
  const data = await db
    .select({ id: artists.id, name: artists.name })
    .from(artists)
    .orderBy(asc(artists.name));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { name, bio, image_key } = await req.json();
  const [data] = await db
    .insert(artists)
    .values({ name, bio, imageKey: image_key })
    .returning();
  return NextResponse.json(data);
}
