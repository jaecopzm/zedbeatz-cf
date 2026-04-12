import { supabase } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const deny = await requireAdmin(); if (deny) return deny;
  try {
    // Find exact matches only
    const { data: artists } = await supabase
      .from('artists')
      .select('id, name, slug')
      .or('name.eq.Chile One,name.eq.Chile One Mr Zambia');
    
    if (!artists || artists.length === 0) {
      return NextResponse.json({ error: 'No artists found' });
    }
    
    if (artists.length === 1) {
      return NextResponse.json({ message: 'Only one artist found, no merge needed', artist: artists[0] });
    }
    
    // Keep Chile One Mr Zambia
    const keep = artists.find(a => a.name === 'Chile One Mr Zambia');
    const remove = artists.find(a => a.name === 'Chile One');
    
    if (!keep || !remove) {
      return NextResponse.json({ error: 'Could not find both artists', artists });
    }
    
    // Update all tracks
    const { data: updated, error: updateError } = await supabase
      .from('tracks')
      .update({ artist_id: keep.id })
      .eq('artist_id', remove.id)
      .select('id, title');
    
    if (updateError) {
      return NextResponse.json({ error: 'Update failed', details: updateError }, { status: 500 });
    }
    
    // Delete the duplicate
    const { error: deleteError } = await supabase
      .from('artists')
      .delete()
      .eq('id', remove.id);
    
    if (deleteError) {
      return NextResponse.json({ error: 'Delete failed', details: deleteError }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      kept: keep.name,
      removed: remove.name,
      tracksUpdated: updated?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
