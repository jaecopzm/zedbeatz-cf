# 🎵 Agent → ZedBeatz Integration Plan

## Current Agent Workflow Analysis

### 1. **Music Download System**
- Downloads from: YouTube, Boomplay, SoundCloud, Telegram
- Stores in: `/tmp` or custom directory
- Formats: MP3, M4A
- Features:
  - Duplicate detection (fuzzy matching)
  - Metadata extraction (ID3 tags)
  - Cover art extraction/search
  - Audio watermarking (ZedBeatz-Logo.mp3)
  - Silence trimming (ffmpeg)

### 2. **Audio Processing Pipeline**
```
Download → Trim Silence → Extract Metadata → Add Watermark → Tag Audio → Upload to WordPress
```

**Watermarking:**
- Bundled audio: `/home/jaeycop/projects/agent/assets/ZedBeatz-Logo.mp3`
- TTS fallback: "Download more music at ZedBeatz.com"
- Applied at start and end of track
- Configurable on/off

**Metadata Tagging:**
- Artist, Title, Album
- Cover art embedding
- Genre detection
- Custom tags

### 3. **WordPress Upload**
- REST API integration
- Duplicate checking (80% keyword overlap)
- Auto-post generation with AI (Groq)
- SEO optimization
- Scheduled publishing

---

## 🎯 Integration Strategy

### Phase 1: Direct Upload to ZedBeatz (Immediate)

**Goal:** Use agent's downloaded music to populate ZedBeatz database

**Approach:**
1. Agent downloads music → processes → saves locally
2. New script reads processed files
3. Uploads to ZedBeatz via API

**Benefits:**
- ✅ Reuse existing watermarked audio
- ✅ Leverage agent's metadata extraction
- ✅ No duplicate WordPress dependency

---

### Phase 2: Unified Pipeline (Future)

**Goal:** Agent directly uploads to ZedBeatz instead of WordPress

**Approach:**
1. Add ZedBeatz API endpoints to agent
2. Replace WordPress upload with ZedBeatz upload
3. Keep watermarking and processing

---

## 📋 Implementation Plan

### Step 1: Create ZedBeatz Upload Script

**Location:** `/home/jaeycop/projects/zedbeatz/scripts/import-from-agent.js`

**Features:**
- Read processed MP3s from agent's output directory
- Extract metadata (already embedded by agent)
- Upload audio to R2
- Upload cover to R2
- Create track in Supabase
- Link to artist (create if needed)

**Input:** Directory with processed MP3s (watermarked, tagged)
**Output:** Tracks in ZedBeatz database

---

### Step 2: Modify Agent to Export for ZedBeatz

**Option A: Separate Export Directory**
```python
# In agent config
EXPORT_DIR = "/home/jaeycop/projects/agent/exports/zedbeatz"
```

After processing, copy final MP3 + metadata JSON to export dir:
```
exports/zedbeatz/
├── Artist Name - Song Title.mp3
├── Artist Name - Song Title.json  # metadata
└── Artist Name - Song Title.jpg   # cover
```

**Option B: Direct API Integration**
Add ZedBeatz API client to agent:
```python
# music_downloader.py
def upload_to_zedbeatz(file_path, metadata):
    # Upload to R2
    # Create track in Supabase
    pass
```

---

### Step 3: Watermark Reuse

**Current:** Agent has `ZedBeatz-Logo.mp3` (37KB audio watermark)

**Action:** 
- ✅ Keep using this watermark
- ✅ Already embedded in downloaded tracks
- ✅ No changes needed

**Alternative:** If you want a different watermark for streaming platform:
- Create new watermark audio
- Replace `/home/jaeycop/projects/agent/assets/ZedBeatz-Logo.mp3`

---

## 🚀 Quick Start Implementation

### Recommended: Option A (Separate Export + Import Script)

**Why:**
- ✅ Keeps agent and ZedBeatz decoupled
- ✅ Agent continues working with WordPress
- ✅ Easy to test and debug
- ✅ Can batch import anytime

**Steps:**

1. **Configure agent to export processed files**
   ```python
   # Add to agent config
   ZEDBEATZ_EXPORT = True
   ZEDBEATZ_EXPORT_DIR = "/home/jaeycop/projects/agent/exports/zedbeatz"
   ```

2. **Create import script** (I'll build this)
   ```bash
   node scripts/import-from-agent.js /home/jaeycop/projects/agent/exports/zedbeatz
   ```

3. **Workflow:**
   ```
   Agent downloads → processes → exports to folder
   ↓
   Run import script → uploads to ZedBeatz
   ```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT PROJECT                             │
│                                                              │
│  1. Download from sources (YouTube, Boomplay, etc.)         │
│  2. Trim silence (ffmpeg)                                   │
│  3. Extract/search cover art                                │
│  4. Add ZedBeatz watermark (start + end)                    │
│  5. Embed metadata (ID3 tags)                               │
│  6. Export to: /agent/exports/zedbeatz/                     │
│                                                              │
│     Output:                                                  │
│     ├── Artist - Title.mp3 (watermarked, tagged)           │
│     ├── Artist - Title.json (metadata)                      │
│     └── Artist - Title.jpg (cover)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              IMPORT SCRIPT (Node.js)                         │
│                                                              │
│  1. Read exported files                                      │
│  2. Upload audio to R2 (Cloudflare)                         │
│  3. Upload cover to R2                                       │
│  4. Get/create artist in Supabase                           │
│  5. Create track record in Supabase                          │
│  6. Link track to artist                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    ZEDBEATZ                                  │
│                                                              │
│  ✅ Track available for streaming                           │
│  ✅ Searchable by artist/title                              │
│  ✅ Playable with watermarked audio                         │
│  ✅ Cover art displayed                                      │
│  ✅ Download available                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Watermark Strategy

### Current Setup (Agent)
- **Audio watermark:** "ZedBeatz" voice at start/end
- **Duration:** ~2-3 seconds
- **Volume:** -8dB (subtle)
- **Fade:** 200ms in/out

### For ZedBeatz Platform
**Keep the same watermark** because:
- ✅ Already branded as ZedBeatz
- ✅ Professional quality
- ✅ Non-intrusive
- ✅ Prevents unauthorized redistribution

**Optional:** Add visual watermark to cover images
- Overlay "ZedBeatz" logo on album art
- Transparent, corner placement
- Only for uploaded covers (not artist-provided)

---

## 🔧 Technical Requirements

### Agent Side
- Python 3.8+
- ffmpeg (already installed)
- Existing dependencies (mutagen, pydub, etc.)

### ZedBeatz Side
- Node.js 16+ (already have)
- Access to R2 credentials (already configured)
- Supabase credentials (already configured)

### New Dependencies
```bash
# None! Use existing setup
```

---

## 📝 Next Steps

1. **Decide on approach:**
   - [ ] Option A: Export folder + import script (recommended)
   - [ ] Option B: Direct API integration

2. **I'll create:**
   - [ ] Import script (`import-from-agent.js`)
   - [ ] Agent export configuration
   - [ ] Metadata JSON schema
   - [ ] Error handling & logging

3. **You'll:**
   - [ ] Download some music with agent
   - [ ] Test export functionality
   - [ ] Run import script
   - [ ] Verify tracks in ZedBeatz

---

## 🎯 Success Criteria

- ✅ Agent downloads and processes music
- ✅ Watermark embedded in audio
- ✅ Metadata properly tagged
- ✅ Files exported to staging directory
- ✅ Import script uploads to R2
- ✅ Tracks appear in ZedBeatz
- ✅ Audio plays with watermark
- ✅ Cover art displays correctly
- ✅ Artist attribution correct
- ✅ Download works

---

## 💡 Future Enhancements

1. **Auto-sync:** Watch agent export folder, auto-import new files
2. **Batch processing:** Import multiple tracks in parallel
3. **Duplicate detection:** Check if track already exists in ZedBeatz
4. **Quality control:** Validate audio quality before import
5. **Analytics:** Track which sources provide best quality
6. **Playlist generation:** Auto-create playlists by genre/artist

---

**Ready to implement Option A?** Let me know and I'll create the import script!
