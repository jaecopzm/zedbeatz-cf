import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");

loadEnvFile(ENV_PATH);

const SUPABASE_URL = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  throw new Error("Missing Supabase service key");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const options = parseArgs(process.argv.slice(2));

async function main() {
  const playlists = await fetchFavouritePlaylists();
  const groups = groupByUser(playlists).filter((group) => group.playlists.length > 1);

  if (groups.length === 0) {
    console.log("No duplicate Favourites playlists found.");
    return;
  }

  console.log(`Found ${groups.length} user(s) with duplicate Favourites playlists.`);
  console.log(options.dryRun ? "mode=dry-run" : "mode=write");

  let mergedUsers = 0;
  let deletedPlaylists = 0;
  let insertedTracks = 0;

  for (const group of groups) {
    const ordered = [...group.playlists].sort((a, b) => a.id - b.id);
    const canonical = ordered[0];
    const duplicates = ordered.slice(1);

    console.log("");
    console.log(
      `user=${group.userId} canonical=#${canonical.id} duplicates=${duplicates.map((p) => `#${p.id}`).join(", ")}`
    );

    const playlistIds = ordered.map((playlist) => playlist.id);
    const playlistTracks = await fetchPlaylistTracks(playlistIds);
    const tracksByPlaylist = new Map(playlistIds.map((id) => [id, []]));

    for (const row of playlistTracks) {
      tracksByPlaylist.get(row.playlist_id)?.push(row);
    }

    const canonicalTracks = sortTracks(tracksByPlaylist.get(canonical.id) ?? []);
    const seenTrackIds = new Set(canonicalTracks.map((track) => track.track_id));
    let nextPosition =
      canonicalTracks.reduce((max, track) => Math.max(max, track.position), -1) + 1;

    const inserts = [];

    for (const duplicate of duplicates) {
      const duplicateTracks = sortTracks(tracksByPlaylist.get(duplicate.id) ?? []);
      for (const track of duplicateTracks) {
        if (seenTrackIds.has(track.track_id)) {
          continue;
        }

        seenTrackIds.add(track.track_id);
        inserts.push({
          playlist_id: canonical.id,
          track_id: track.track_id,
          position: nextPosition,
        });
        nextPosition += 1;
      }
    }

    if (options.dryRun) {
      console.log(
        `would insert ${inserts.length} track(s), delete ${duplicates.length} duplicate playlist(s)`
      );
      mergedUsers += 1;
      deletedPlaylists += duplicates.length;
      insertedTracks += inserts.length;
      continue;
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabase.from("playlist_tracks").insert(inserts);
      if (insertError) {
        throw new Error(
          `Failed to merge tracks into playlist ${canonical.id}: ${insertError.message}`
        );
      }
    }

    const duplicateIds = duplicates.map((playlist) => playlist.id);

    const { error: deleteTracksError } = await supabase
      .from("playlist_tracks")
      .delete()
      .in("playlist_id", duplicateIds);

    if (deleteTracksError) {
      throw new Error(
        `Failed to delete duplicate playlist tracks for user ${group.userId}: ${deleteTracksError.message}`
      );
    }

    const { error: deletePlaylistsError } = await supabase
      .from("playlists")
      .delete()
      .in("id", duplicateIds);

    if (deletePlaylistsError) {
      throw new Error(
        `Failed to delete duplicate playlists for user ${group.userId}: ${deletePlaylistsError.message}`
      );
    }

    console.log(
      `inserted ${inserts.length} track(s), deleted ${duplicates.length} duplicate playlist(s)`
    );

    mergedUsers += 1;
    deletedPlaylists += duplicates.length;
    insertedTracks += inserts.length;
  }

  console.log("");
  console.log(`Users merged: ${mergedUsers}`);
  console.log(`Tracks inserted: ${insertedTracks}`);
  console.log(`Duplicate playlists deleted: ${deletedPlaylists}`);
}

async function fetchFavouritePlaylists() {
  const { data, error } = await supabase
    .from("playlists")
    .select("id, user_id, created_at")
    .eq("name", "Favourites")
    .not("user_id", "is", null)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch Favourites playlists: ${error.message}`);
  }

  return data ?? [];
}

async function fetchPlaylistTracks(playlistIds) {
  const { data, error } = await supabase
    .from("playlist_tracks")
    .select("playlist_id, track_id, position")
    .in("playlist_id", playlistIds)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch playlist tracks: ${error.message}`);
  }

  return data ?? [];
}

function groupByUser(playlists) {
  const byUser = new Map();

  for (const playlist of playlists) {
    if (!playlist.user_id) continue;
    if (!byUser.has(playlist.user_id)) {
      byUser.set(playlist.user_id, []);
    }
    byUser.get(playlist.user_id).push(playlist);
  }

  return Array.from(byUser.entries()).map(([userId, userPlaylists]) => ({
    userId,
    playlists: userPlaylists,
  }));
}

function sortTracks(tracks) {
  return [...tracks].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.track_id - b.track_id;
  });
}

function parseArgs(args) {
  const parsed = { dryRun: false };

  for (const arg of args) {
    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
