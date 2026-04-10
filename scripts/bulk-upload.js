#!/usr/bin/env node

/**
 * Bulk Upload Script for ZedBeatz
 * 
 * Usage:
 *   node scripts/bulk-upload.js <directory>
 * 
 * Directory structure:
 *   songs/
 *     ├── artist1/
 *     │   ├── song1.mp3
 *     │   ├── song1.jpg (optional cover)
 *     │   ├── song2.mp3
 *     │   └── song2.jpg
 *     └── artist2/
 *         └── song3.mp3
 * 
 * The script will:
 * 1. Create artists if they don't exist
 * 2. Upload audio files to R2
 * 3. Upload cover images to R2
 * 4. Create track records in database
 */

const fs = require('fs');
const path = require('path');

async function uploadFile(filePath, filename, contentType) {
  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType })
  });
  const { url, key } = await res.json();
  
  const fileBuffer = fs.readFileSync(filePath);
  await fetch(url, {
    method: 'PUT',
    body: fileBuffer,
    headers: { 'Content-Type': contentType }
  });
  
  return key;
}

async function getOrCreateArtist(name) {
  // Get existing artists
  const res = await fetch('http://localhost:3000/api/admin/artists');
  const artists = await res.json();
  
  const existing = artists.find(a => a.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  
  // Create new artist
  const createRes = await fetch('http://localhost:3000/api/admin/artists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const newArtist = await createRes.json();
  return newArtist.id;
}

async function createTrack(title, artistId, audioKey, coverKey) {
  const res = await fetch('http://localhost:3000/api/admin/tracks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      artist_id: artistId,
      audio_key: audioKey,
      cover_key: coverKey
    })
  });
  return res.json();
}

async function processDirectory(dir) {
  const artists = fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory());
  
  for (const artistDir of artists) {
    const artistName = artistDir.name;
    console.log(`\n📁 Processing artist: ${artistName}`);
    
    const artistId = await getOrCreateArtist(artistName);
    console.log(`✓ Artist ID: ${artistId}`);
    
    const artistPath = path.join(dir, artistName);
    const files = fs.readdirSync(artistPath);
    const audioFiles = files.filter(f => f.endsWith('.mp3') || f.endsWith('.m4a'));
    
    for (const audioFile of audioFiles) {
      const baseName = path.parse(audioFile).name;
      const title = baseName.replace(/_/g, ' ');
      
      console.log(`\n  🎵 Uploading: ${title}`);
      
      // Upload audio
      const audioPath = path.join(artistPath, audioFile);
      const audioKey = await uploadFile(audioPath, audioFile, 'audio/mpeg');
      console.log(`  ✓ Audio uploaded: ${audioKey}`);
      
      // Check for cover image
      let coverKey = null;
      const coverExts = ['.jpg', '.jpeg', '.png', '.webp'];
      for (const ext of coverExts) {
        const coverFile = baseName + ext;
        const coverPath = path.join(artistPath, coverFile);
        if (fs.existsSync(coverPath)) {
          const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          coverKey = await uploadFile(coverPath, coverFile, contentType);
          console.log(`  ✓ Cover uploaded: ${coverKey}`);
          break;
        }
      }
      
      // Create track
      const track = await createTrack(title, artistId, audioKey, coverKey);
      console.log(`  ✓ Track created: ID ${track.id}`);
    }
  }
  
  console.log('\n✅ All done!');
}

// Main
const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/bulk-upload.js <directory>');
  process.exit(1);
}

if (!fs.existsSync(dir)) {
  console.error(`Directory not found: ${dir}`);
  process.exit(1);
}

processDirectory(dir).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
