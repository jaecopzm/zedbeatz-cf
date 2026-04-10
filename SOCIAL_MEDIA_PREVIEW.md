# Social Media Preview Testing

Your track pages already have Open Graph and Twitter Card meta tags! 🎉

## What's Included:

### Open Graph (Facebook, WhatsApp, LinkedIn, etc.)
- ✅ Title: `{title} — {artist}`
- ✅ Description: `Listen to {title} by {artist} on ZedBeatz`
- ✅ Image: 1200x1200 cover art
- ✅ URL: Canonical track URL
- ✅ Type: `music.song`

### Twitter Card
- ✅ Card type: `summary_large_image`
- ✅ Title, description, and image
- ✅ Creator: @ZedBeatz

### JSON-LD Structured Data
- ✅ Schema.org MusicRecording
- ✅ Artist, duration, genre, plays
- ✅ Helps Google show rich results

## Test Your Links:

### 1. Facebook/Meta Debugger
https://developers.facebook.com/tools/debug/
- Paste your track URL
- Click "Scrape Again" to refresh cache

### 2. Twitter Card Validator
https://cards-dev.twitter.com/validator
- Paste your track URL
- See preview

### 3. LinkedIn Post Inspector
https://www.linkedin.com/post-inspector/
- Paste your track URL
- Check preview

### 4. WhatsApp
Just paste the link in a chat - it will auto-preview

## Example Track URL:
```
https://zedbeatz.vercel.app/track/yo-maps-aweah
```

## Troubleshooting:

### Cover not showing?
1. Check if `cover_key` exists in database
2. Verify R2 public URL is accessible
3. Image must be publicly accessible (no auth required)
4. Clear social media cache using debuggers above

### Wrong info showing?
Social media platforms cache previews for 24-48 hours. Use the debuggers above to force refresh.

## What Happens When You Share:

**Facebook/WhatsApp:**
```
┌─────────────────────────────────┐
│  [1200x1200 Cover Image]        │
├─────────────────────────────────┤
│ Aweah — Yo Maps                 │
│ Listen to Aweah by Yo Maps on   │
│ ZedBeatz                         │
│ zedbeatz.vercel.app              │
└─────────────────────────────────┘
```

**Twitter:**
```
┌─────────────────────────────────┐
│  [Large Cover Image]             │
├─────────────────────────────────┤
│ Aweah — Yo Maps                 │
│ Listen to Aweah by Yo Maps on   │
│ ZedBeatz                         │
│ 🔗 zedbeatz.vercel.app           │
└─────────────────────────────────┘
```

## Next Steps:

1. Upload a track with cover art
2. Test the URL in Facebook debugger
3. Share on social media!

Note: Make sure your production domain is updated from `zedbeatz.vercel.app` to your actual domain in the track page code.
