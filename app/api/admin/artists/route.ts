import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny;
  const { data, error } = await supabase.from("artists").select("id, name").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { name, bio, image_key } = await req.json();
  const { data, error } = await supabase.from("artists").insert({ name, bio, image_key }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
