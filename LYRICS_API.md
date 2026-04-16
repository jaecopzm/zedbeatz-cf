# Lyrics API Endpoints

## Overview
The ZedBeatz backend now supports lyrics retrieval for tracks. Lyrics are automatically fetched and stored during the upload process via the agent.

## Database Schema
```sql
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS lyrics TEXT,
ADD COLUMN IF NOT EXISTS synced_lyrics TEXT;
```

- `lyrics`: Plain text lyrics
- `synced_lyrics`: LRC format lyrics with timestamps (for karaoke-style display)

## Endpoints

### 1. Get Track Lyrics
**GET** `/api/tracks/[id]/lyrics`

Retrieves lyrics for a specific track.

**Response:**
```json
{
  "id": 123,
  "title": "Song Title",
  "artist": "Artist Name",
  "lyrics": "Plain text lyrics...",
  "synced_lyrics": "[00:12.00]Line 1\n[00:15.50]Line 2...",
  "has_lyrics": true
}
```

**Example:**
```bash
curl https://zedbeatz.com/api/tracks/123/lyrics
```

### 2. Batch Check Lyrics Availability
**POST** `/api/lyrics/check`

Check which tracks have lyrics available (useful for showing lyrics icon in UI).

**Request Body:**
```json
{
  "track_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
[
  {
    "id": 1,
    "has_lyrics": true,
    "has_synced": true
  },
  {
    "id": 2,
    "has_lyrics": true,
    "has_synced": false
  },
  {
    "id": 3,
    "has_lyrics": false,
    "has_synced": false
  }
]
```

**Example:**
```bash
curl -X POST https://zedbeatz.com/api/lyrics/check \
  -H "Content-Type: application/json" \
  -d '{"track_ids": [1, 2, 3]}'
```

## Integration with Mobile App

### Flutter Example

```dart
// Fetch lyrics for a track
Future<Map<String, dynamic>?> fetchLyrics(int trackId) async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/tracks/$trackId/lyrics'),
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  }
  return null;
}

// Check multiple tracks for lyrics
Future<List<dynamic>> checkLyricsAvailability(List<int> trackIds) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/lyrics/check'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({'track_ids': trackIds}),
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  }
  return [];
}
```

## LRC Format (Synced Lyrics)

The `synced_lyrics` field uses the LRC format:
```
[00:12.00]First line of lyrics
[00:15.50]Second line of lyrics
[00:18.00]Third line of lyrics
```

Format: `[MM:SS.xx]Lyric text`
- MM: Minutes (2 digits)
- SS: Seconds (2 digits)
- xx: Centiseconds (2 digits)

### Parsing LRC in Flutter

```dart
class LyricLine {
  final Duration timestamp;
  final String text;
  
  LyricLine(this.timestamp, this.text);
}

List<LyricLine> parseLRC(String lrc) {
  final lines = <LyricLine>[];
  final regex = RegExp(r'\[(\d{2}):(\d{2})\.(\d{2})\](.*)');
  
  for (final line in lrc.split('\n')) {
    final match = regex.firstMatch(line);
    if (match != null) {
      final minutes = int.parse(match.group(1)!);
      final seconds = int.parse(match.group(2)!);
      final centiseconds = int.parse(match.group(3)!);
      final text = match.group(4)!.trim();
      
      final timestamp = Duration(
        minutes: minutes,
        seconds: seconds,
        milliseconds: centiseconds * 10,
      );
      
      lines.add(LyricLine(timestamp, text));
    }
  }
  
  return lines;
}
```

## Coverage

Based on agent testing:
- African/Zambian artists: ~60-70%
- International hits: ~40-50%
- Overall: ~50-60% success rate

Tracks without lyrics will have `null` values for both `lyrics` and `synced_lyrics` fields.

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `404`: Track not found
- `500`: Server error

Error response format:
```json
{
  "error": "Error message"
}
```

## Next Steps

1. ✅ Run SQL migration in Supabase
2. ✅ Create API endpoints
3. [ ] Add lyrics display in mobile app
4. [ ] Add lyrics display in web player
5. [ ] Optional: Add manual lyrics editing in admin panel
