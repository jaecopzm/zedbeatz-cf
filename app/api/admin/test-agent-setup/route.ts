import { supabase } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny;
  const checks = {
    database: { status: "unknown", details: {} },
    endpoints: { status: "unknown", details: {} },
  };

  try {
    // Check if tracks table has required columns
    const { data: tracks, error } = await supabase
      .from("tracks")
      .select("id, title, artist_id, audio_key, cover_key, genre, featured_artists, slug")
      .limit(1);

    if (error) {
      checks.database.status = "error";
      checks.database.details = { error: error.message };
    } else {
      checks.database.status = "ok";
      checks.database.details = {
        message: "All required columns exist",
        columns: ["id", "title", "artist_id", "audio_key", "cover_key", "genre", "featured_artists", "slug"],
      };
    }

    // Check if artists endpoint works
    const { data: artists, error: artistError } = await supabase
      .from("artists")
      .select("id, name")
      .limit(1);

    if (artistError) {
      checks.endpoints.status = "error";
      checks.endpoints.details = { error: artistError.message };
    } else {
      checks.endpoints.status = "ok";
      checks.endpoints.details = {
        message: "Artists endpoint working",
        sample_count: artists?.length || 0,
      };
    }

    const allOk = checks.database.status === "ok" && checks.endpoints.status === "ok";

    return NextResponse.json({
      ready: allOk,
      message: allOk ? "✅ Agent upload is ready!" : "⚠️ Some checks failed",
      checks,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ready: false,
        message: "❌ Setup check failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
