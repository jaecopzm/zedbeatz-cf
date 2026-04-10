import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
let _supabasePublic: ReturnType<typeof createClient<Database>> | null = null;

// Server-side client with service role key (bypasses RLS — only use in API routes)
export const supabase = (() => {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
})();

// Public client for client-side use (respects RLS)
export const supabasePublic = (() => {
  if (!_supabasePublic) {
    _supabasePublic = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabasePublic;
})();
