import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { id } = await params;
  const { name, bio, image_key } = await req.json();
  const { error } = await supabase.from("artists").update({ name, bio, image_key }).eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { id } = await params;
  const { error } = await supabase.from("artists").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
