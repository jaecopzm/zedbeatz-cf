import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");

loadEnvFile(ENV_PATH);

const SUPABASE_URL = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const R2_PUBLIC_URL = requiredEnv("R2_PUBLIC_URL").replace(/\/$/, "");

if (!SUPABASE_KEY) {
  throw new Error("Missing Supabase service key");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const options = parseArgs(process.argv.slice(2));

async function main() {
  const tracks = await fetchTracks(options.limit);

  if (tracks.length === 0) {
    console.log("No tracks with missing duration found.");
    return;
  }

  console.log(`Found ${tracks.length} track(s) with missing duration.`);
  console.log(
    [
      options.dryRun ? "mode=dry-run" : "mode=write",
      `limit=${options.limit ?? "all"}`,
      `concurrency=${options.concurrency}`,
    ].join(" ")
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  await runWithConcurrency(tracks, options.concurrency, async (track, index) => {
    const label = `[${index + 1}/${tracks.length}] #${track.id} ${track.title}`;

    try {
      const duration = await probeDuration(`${R2_PUBLIC_URL}/${track.audio_key}`);

      if (!duration || duration <= 0) {
        skipped += 1;
        console.log(`${label} -> skipped (no duration)`);
        return;
      }

      if (options.dryRun) {
        updated += 1;
        console.log(`${label} -> ${duration}s (dry-run)`);
        return;
      }

      const { error } = await supabase
        .from("tracks")
        .update({ duration })
        .eq("id", track.id);

      if (error) {
        failed += 1;
        console.error(`${label} -> update failed: ${error.message}`);
        return;
      }

      updated += 1;
      console.log(`${label} -> ${duration}s`);
    } catch (error) {
      failed += 1;
      console.error(`${label} -> probe failed: ${getErrorMessage(error)}`);
    }
  });

  console.log("");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

async function fetchTracks(limit) {
  const pageSize = 200;
  const results = [];
  let offset = 0;

  while (true) {
    const upperBound =
      limit == null ? offset + pageSize - 1 : Math.min(offset + pageSize - 1, limit - 1);

    if (limit != null && offset >= limit) {
      break;
    }

    const { data, error } = await supabase
      .from("tracks")
      .select("id, title, audio_key")
      .is("duration", null)
      .not("audio_key", "is", null)
      .order("id", { ascending: true })
      .range(offset, upperBound);

    if (error) {
      throw new Error(`Failed to fetch tracks: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    results.push(...data);
    offset += data.length;

    if (data.length < pageSize) {
      break;
    }
  }

  return results;
}

async function probeDuration(url) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    url,
  ]);

  const seconds = Number.parseFloat(stdout.trim());
  return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
}

async function runWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });

  await Promise.all(runners);
}

function parseArgs(args) {
  const parsed = {
    dryRun: false,
    limit: null,
    concurrency: 4,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (arg === "--limit") {
      parsed.limit = Number.parseInt(args[index + 1] ?? "", 10);
      index += 1;
      continue;
    }

    if (arg === "--concurrency") {
      parsed.concurrency = Number.parseInt(args[index + 1] ?? "", 10);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (parsed.limit != null && (!Number.isInteger(parsed.limit) || parsed.limit <= 0)) {
    throw new Error("--limit must be a positive integer");
  }

  if (!Number.isInteger(parsed.concurrency) || parsed.concurrency <= 0) {
    throw new Error("--concurrency must be a positive integer");
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

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error) => {
  console.error(getErrorMessage(error));
  process.exitCode = 1;
});
