export const runtime = 'edge';

import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { track_id } = await req.json();

  if (!track_id) return NextResponse.json({ error: "Missing track_id" }, { status: 400 });

  if (userId) {
    // Delete existing entry for this user+track, then insert new one
    await supabase
      .from("recently_played")
      .delete()
      .eq("user_id", userId)
      .eq("track_id", track_id);

    await supabase
      .from("recently_played")
      .insert({ track_id, user_id: userId, played_at: new Date().toISOString() });
  } else {
    // Anonymous play
    await supabase.from("recently_played").insert({ track_id, played_at: new Date().toISOString() });
  }

  return NextResponse.json({ ok: true });
}
