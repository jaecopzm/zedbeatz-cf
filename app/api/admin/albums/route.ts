import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny;
  const { data } = await supabase.from("albums").select("id, title, artist_id, release_year, artists(name)").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const body = await req.json();
  const { data, error } = await supabase.from("albums").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}