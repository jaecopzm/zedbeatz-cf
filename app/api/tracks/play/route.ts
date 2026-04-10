import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Try RPC first, fall back to read-increment-write
  const { error } = await supabase.rpc("increment_plays", { track_id: id });
  if (error) {
    const { data } = await supabase.from("tracks").select("plays").eq("id", id).single();
    await supabase.from("tracks").update({ plays: (data?.plays ?? 0) + 1 }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
