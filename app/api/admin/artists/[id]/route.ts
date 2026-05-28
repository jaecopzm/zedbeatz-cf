import { db } from "@/lib/db/drizzle";
import { artists } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { id } = await params;
  const { name, bio, image_key } = await req.json();
  await db
    .update(artists)
    .set({ name, bio, imageKey: image_key })
    .where(eq(artists.id, Number(id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { id } = await params;
  await db.delete(artists).where(eq(artists.id, Number(id)));
  return NextResponse.json({ ok: true });
}
