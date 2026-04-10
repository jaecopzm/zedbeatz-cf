import { supabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateTrackSlug } from "@/lib/slugify";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { searchParams } = new URL(req.url);
  const artist_id = searchParams.get("artist_id");
  const title = searchParams.get("title");
  const artist_name = searchParams.get("artist_name");

  if (artist_name && title) {
    // Duplicate check by artist name + title (used before agent upload)
    const { data: artists } = await supabase
      .from("artists")
      .select("id")
      .ilike("name", artist_name.trim())
      .limit(5);
    if (artists && artists.length > 0) {
      const ids = artists.map(a => a.id);
      const { data } = await supabase
        .from("tracks")
        .select("id, title, artists(name)")
        .in("artist_id", ids)
        .ilike("title", title.trim())
        .limit(1);
      return NextResponse.json(data || []);
    }
    return NextResponse.json([]);
  }

  if (artist_id && title) {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("artist_id", Number(artist_id))
      .ilike("title", title)
      .limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }
  
  // Return all tracks if no filters
  const { data, error } = await supabase.from("tracks").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const body = await req.json();
  
  // Remove stale 'featured' boolean column (renamed to featured_artists)
  delete body.featured;
  
  // Generate slug if not provided (only if column exists)
  if (!body.slug && body.title && body.artist_id) {
    try {
      const { data: artist } = await supabase
        .from("artists")
        .select("name")
        .eq("id", body.artist_id)
        .single();
      
      if (artist) {
        body.slug = generateTrackSlug(artist.name, body.title);
      }
    } catch (e) {
      // Slug generation failed, continue without it
    }
  }
  
  const { data, error } = await supabase.from("tracks").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { id, featured_artists, ...fields } = await req.json();
  
  // If featured_artists is being updated, create artist records for them if they don't exist
  if (featured_artists !== undefined && featured_artists) {
    const featuredNames = featured_artists
      .split(/[,&]|feat\.|ft\./)
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0);
    
    for (const name of featuredNames) {
      // Check if artist exists (case-insensitive)
      const { data: existing } = await supabase
        .from("artists")
        .select("id")
        .ilike("name", name)
        .limit(1);
      
      // Create artist if doesn't exist
      if (!existing || existing.length === 0) {
        await supabase.from("artists").insert({ name });
      }
    }
  }
  
  const updateData = featured_artists !== undefined 
    ? { ...fields, featured_artists } 
    : fields;
  
  const { error } = await supabase.from("tracks").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny;
  const { id } = await req.json();
  const { error } = await supabase.from("tracks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
