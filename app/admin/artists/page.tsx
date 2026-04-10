export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import ArtistEditor from "./artist-editor";

export default async function AdminArtistsPage() {
  const { data } = await supabase
    .from("artists")
    .select("id, name, bio, image_key")
    .order("name")
    .limit(200); // Add limit
    
  const artists = (data ?? []).map((a) => ({ 
    ...a, 
    imageUrl: a.image_key ? getPublicUrl(a.image_key) : null 
  }));
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Artists</h1>
        <p className="text-[var(--muted)] text-sm mt-1">{artists.length} artists</p>
      </div>
      <ArtistEditor artists={artists} />
    </div>
  );
}
