# Social Media Preview Setup ✅

## What's Already Done:

Your track pages now have complete social media preview support!

### ✅ Open Graph Tags (Facebook, WhatsApp, LinkedIn)
- Title: `{title} — {artist}`
- Description: Stream and download info
- Image: 1200x1200 cover art from R2
- Type: `music.song`

### ✅ Twitter Cards
- Card: `summary_large_image`
- Full metadata with cover image

### ✅ JSON-LD Structured Data
- Schema.org MusicRecording
- Helps Google show rich results

### ✅ Dynamic URLs
- Uses `NEXT_PUBLIC_SITE_URL` environment variable
- Update for production domain

## Environment Setup:

```bash
# .env.local (already added)
NEXT_PUBLIC_SITE_URL=https://zedbeatz.vercel.app

# For production, update to:
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Test Your Previews:

### 1. Facebook/WhatsApp
https://developers.facebook.com/tools/debug/
- Paste: `https://zedbeatz.vercel.app/track/your-track-slug`
- Click "Scrape Again"

### 2. Twitter
https://cards-dev.twitter.com/validator
- Paste your track URL
- See live preview

### 3. LinkedIn
https://www.linkedin.com/post-inspector/
- Paste your track URL

## Requirements for Covers to Show:

✅ Track must have `cover_key` in database
✅ R2 bucket must be publicly accessible
✅ Cover URL must return proper image (not 404)
✅ Image should be at least 200x200 (yours are 1000x1000 ✅)

## Preview Example:

When you share: `https://zedbeatz.vercel.app/track/yo-maps-aweah`

**Facebook/WhatsApp shows:**
```
┌──────────────────────────────────┐
│                                  │
│    [1200x1200 Album Cover]       │
│                                  │
├──────────────────────────────────┤
│ Aweah — Yo Maps                  │
│ Listen to Aweah by Yo Maps on    │
│ ZedBeatz                          │
│ 🔗 zedbeatz.vercel.app            │
└──────────────────────────────────┘
```

## Troubleshooting:

**Cover not showing?**
1. Check R2_PUBLIC_URL is accessible
2. Verify cover_key exists in database
3. Test cover URL directly in browser
4. Clear social media cache using debuggers

**Old preview showing?**
Social platforms cache for 24-48 hours. Use debuggers to force refresh.

## Next Steps:

1. Upload a track with cover via agent
2. Share the track URL
3. Verify preview shows correctly
4. Update `NEXT_PUBLIC_SITE_URL` for production

All set! 🚀
