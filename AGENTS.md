<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ZedBeatz Memory

## Summary
- **Yo Maps (artist_id=6)**: 62 tracks in DB, all with `audio_key`. Deleted 48 tracks that had no downloadable audio source.
- **Audio source**: CDN at `cdn-spotify.zm.io.vn` — hosts some tracks, misses others. No automated alternative found (yt-dlp blocked on VPS datacenter IP, spotifymate.com has captcha, Deezer free account can't download).
- **Genre fixing**: ~356 tracks still need genre — Groq API rate limited after 44 fixes.
- **Self-featured tracks**: 9 Yo Maps tracks fixed (artists.id=6 → tracks.featured_artists no longer lists "Yo Maps" as featured).
- **CDN migration**: All API routes and frontend pages use `getCoverUrl`/`getAudioUrl` from `@/lib/cdn`.

## Key Context
- **DB**: Postgres via Supabase (`rnllteddxhdyjknspvqy`), pooler port 6543, Drizzle ORM.
- **Admin API**: `https://admin.zedbeatz.com`, deployed via Vercel (git push master → auto-deploy). Auth: `x-agent-secret: zedbeatz-agent-2026`.
- **R2**: Bucket `zedbeatz`, endpoint `https://580289486be253af98dc84ab2653ffab.r2.cloudflarestorage.com`.
- **VPS**: `root@api.zedbeatz.com` — has Python3, yt-dlp v2026.07.04, deno, ffmpeg, cookies at `/root/cookies.txt`.
- **Credentials**: Supabase service role key, Apify token, Deezer ARL (free account), YouTube cookies in `.env.local` and `/root/cookies.txt`.
- **Admin scripts**: `/home/jaeycop/projects/admin/scripts/youtube-backfill.py` (yt-dlp based), `vps-backfill.mjs` (CDN based).

## Remaining Work
1. Genre fixing: Continue Groq API calls in batches of 50 (~7 more calls needed).
2. Track images: Verify CDN cover URLs display correctly across site.
3. Audio: No path forward for the 48 deleted Yo Maps tracks unless a new source emerges (Deezer Premium, residential yt-dlp, or CDN update).
