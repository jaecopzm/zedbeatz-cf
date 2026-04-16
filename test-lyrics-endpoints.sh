#!/bin/bash

# Test Lyrics Endpoints
# Run this after deploying to test the new endpoints

BASE_URL="${1:-http://localhost:3000}"

echo "🎵 Testing ZedBeatz Lyrics Endpoints"
echo "======================================"
echo ""

# Test 1: Get lyrics for a track
echo "Test 1: GET /api/tracks/1/lyrics"
echo "-----------------------------------"
curl -s "$BASE_URL/api/tracks/1/lyrics" | jq '.'
echo ""
echo ""

# Test 2: Batch check lyrics availability
echo "Test 2: POST /api/lyrics/check"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL/api/lyrics/check" \
  -H "Content-Type: application/json" \
  -d '{"track_ids": [1, 2, 3, 4, 5]}' | jq '.'
echo ""
echo ""

# Test 3: Check non-existent track
echo "Test 3: GET /api/tracks/99999/lyrics (should 404)"
echo "-----------------------------------"
curl -s "$BASE_URL/api/tracks/99999/lyrics" | jq '.'
echo ""
echo ""

# Test 4: Invalid batch check request
echo "Test 4: POST /api/lyrics/check (invalid request)"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL/api/lyrics/check" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' | jq '.'
echo ""

echo "✅ Tests complete!"
