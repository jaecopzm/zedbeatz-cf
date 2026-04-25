import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  // Count doesn't require auth
  if (type === "count") {
    const artistId = req.nextUrl.searchParams.get("artist_id");
    try {
      const { count, error } = await (supabase as any)
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("artist_id", Number(artistId));
      
      console.log(`Count query for artist ${artistId}:`, { count, error });
      
      if (error) {
        console.error("Count error:", error);
        return NextResponse.json({ count: 0, error: error.message });
      }
      
      return NextResponse.json({ count: count ?? 0 });
    } catch (err) {
      console.error("Count exception:", err);
      return NextResponse.json({ count: 0, error: String(err) });
    }
  }

  // Other operations require auth
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (type === "check") {
    const artistId = req.nextUrl.searchParams.get("artist_id");
    const { data } = await (supabase as any)
      .from("follows")
      .select("id")
      .eq("user_id", userId)
      .eq("artist_id", Number(artistId))
      .single();
    return NextResponse.json({ following: !!data });
  }

  // Get all followed artists
  const { data } = await (supabase as any)
    .from("follows")
    .select("artist_id, artists(id, name, slug, image_key)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, artist_id } = await req.json();

  try {
    if (action === "follow") {
      const { error } = await (supabase as any).from("follows").insert({ user_id: userId, artist_id });
      if (error) {
        console.error("Follow error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (action === "unfollow") {
      const { error } = await (supabase as any).from("follows").delete().eq("user_id", userId).eq("artist_id", artist_id);
      if (error) {
        console.error("Unfollow error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Follow/unfollow exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
