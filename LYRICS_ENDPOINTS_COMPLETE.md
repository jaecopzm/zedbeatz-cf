# Lyrics Endpoints Created ✅

## Summary

Created two new API endpoints for lyrics support in ZedBeatz backend.

## Files Created

1. **`/app/api/tracks/[id]/lyrics/route.ts`**
   - GET endpoint to fetch lyrics for a specific track
   - Returns: track info + plain lyrics + synced lyrics (LRC format)

2. **`/app/api/lyrics/check/route.ts`**
   - POST endpoint to batch check lyrics availability
   - Accepts array of track IDs
   - Returns which tracks have lyrics (useful for UI icons)

3. **`LYRICS_API.md`**
   - Complete API documentation
   - Integration examples for Flutter
   - LRC format parsing guide

## Endpoints

### Get Track Lyrics
```
GET /api/tracks/{id}/lyrics
```

Response:
```json
{
  "id": 123,
  "title": "Song Title",
  "artist": "Artist Name",
  "lyrics": "Plain text lyrics...",
  "synced_lyrics": "[00:12.00]Line 1...",
  "has_lyrics": true
}
```

### Batch Check
```
POST /api/lyrics/check
Body: {"track_ids": [1, 2, 3]}
```

Response:
```json
[
  {"id": 1, "has_lyrics": true, "has_synced": true},
  {"id": 2, "has_lyrics": false, "has_synced": false}
]
```

## Database

The agent already handles:
- Fetching lyrics from LRCLIB API during upload
- Storing in `tracks.lyrics` and `tracks.synced_lyrics` columns
- ~50-60% coverage for Zambian/African music

## Next Steps

1. ✅ Backend endpoints created
2. [ ] Test endpoints with existing tracks that have lyrics
3. [ ] Integrate into Flutter mobile app
4. [ ] Add lyrics display UI in player screen
5. [ ] Optional: Add to web player

## Testing

```bash
# Test single track lyrics
curl https://zedbeatz.com/api/tracks/123/lyrics

# Test batch check
curl -X POST https://zedbeatz.com/api/lyrics/check \
  -H "Content-Type: application/json" \
  -d '{"track_ids": [1, 2, 3]}'
```

## Integration Ready

The mobile app can now:
1. Check if a track has lyrics before showing lyrics button
2. Fetch and display plain text lyrics
3. Parse and display synced lyrics (karaoke-style)

See `LYRICS_API.md` for complete Flutter integration examples.
