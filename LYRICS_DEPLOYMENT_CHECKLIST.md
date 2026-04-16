# Lyrics Feature Deployment Checklist

## ✅ Completed

### Agent (projects/agent)
- [x] Created `lyrics_fetcher.py` module
- [x] Integrated with `zedbeatz_uploader.py`
- [x] Added lyrics fetching during upload
- [x] Tested with sample tracks
- [x] Created SQL migration script

### Backend (projects/zed/zedbeatz)
- [x] Created `/api/tracks/[id]/lyrics` endpoint
- [x] Created `/api/lyrics/check` endpoint
- [x] Added comprehensive API documentation
- [x] Created test script
- [x] Created mobile integration guide

## 🔄 Pending

### Database
- [ ] Run SQL migration in Supabase:
  ```sql
  ALTER TABLE tracks 
  ADD COLUMN IF NOT EXISTS lyrics TEXT,
  ADD COLUMN IF NOT EXISTS synced_lyrics TEXT;
  ```

### Backend Deployment
- [ ] Commit changes to git
- [ ] Push to repository
- [ ] Deploy to Vercel/production
- [ ] Test endpoints in production:
  ```bash
  ./test-lyrics-endpoints.sh https://zedbeatz.com
  ```

### Mobile App (projects/zedbeatz)
- [ ] Add lyrics models to `lib/models/`
- [ ] Update `lib/services/api_service.dart`
- [ ] Create `lib/utils/lyrics_parser.dart`
- [ ] Create `lib/screens/lyrics_screen.dart`
- [ ] Add lyrics button to player screen
- [ ] Test with tracks that have lyrics
- [ ] Test with tracks without lyrics
- [ ] Add loading states
- [ ] Add error handling

### Optional Enhancements
- [ ] Add lyrics search functionality
- [ ] Add share lyrics feature
- [ ] Auto-scroll to current line
- [ ] Add lyrics to web player
- [ ] Add manual lyrics editing in admin panel
- [ ] Add Genius API as fallback source

## Testing Checklist

### Backend
- [ ] GET `/api/tracks/1/lyrics` returns lyrics
- [ ] GET `/api/tracks/99999/lyrics` returns 404
- [ ] POST `/api/lyrics/check` with valid IDs works
- [ ] POST `/api/lyrics/check` with invalid body returns 400
- [ ] Lyrics are properly formatted (plain text)
- [ ] Synced lyrics are in LRC format

### Mobile App
- [ ] Lyrics button only shows for tracks with lyrics
- [ ] Lyrics screen loads correctly
- [ ] Plain text lyrics display properly
- [ ] Synced lyrics highlight current line
- [ ] Synced lyrics scroll with playback
- [ ] No lyrics message shows for tracks without lyrics
- [ ] Loading state displays while fetching
- [ ] Error handling works for network issues

## Deployment Commands

### Backend
```bash
cd /home/jaeycop/projects/zed/zedbeatz
git add .
git commit -m "Add lyrics API endpoints"
git push
# Vercel will auto-deploy
```

### Mobile App
```bash
cd /home/jaeycop/projects/zedbeatz
flutter pub get
flutter run
# Test on device
flutter build apk --release
```

## Rollback Plan

If issues occur:
1. Revert git commits
2. Redeploy previous version
3. Database columns are nullable, so no data loss
4. Mobile app will gracefully handle missing endpoints

## Support

- API Documentation: `LYRICS_API.md`
- Mobile Integration: `MOBILE_LYRICS_INTEGRATION.md`
- Agent Integration: `projects/agent/LYRICS_INTEGRATION.md`
