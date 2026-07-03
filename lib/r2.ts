import "server-only";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!.trim();
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!.trim();
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!.trim();
const BUCKET = process.env.R2_BUCKET_NAME!.trim();
const ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_CDN = process.env.R2_PUBLIC_URL ?? "https://cdn.zedbeatz.com";

// --- Minimal AWS Sig V4 helpers (Web Crypto, no SDK) ---

async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
}

async function signingKey(date: string): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode("AWS4" + SECRET_KEY).buffer as ArrayBuffer, date);
  const kRegion = await hmac(kDate, "auto");
  const kService = await hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(data: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)));
}

/** Presigned URL for uploading (admin use) */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const datetime = now.toISOString().replace(/[:-]|\.\d+/g, "").slice(0, 15) + "Z";
  const scope = `${date}/auto/s3/aws4_request`;
  const url = new URL(`${ENDPOINT}/${BUCKET}/${encodeURIComponent(key)}`);

  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${ACCESS_KEY}/${scope}`,
    "X-Amz-Date": datetime,
    "X-Amz-Expires": "3600",
    "X-Amz-SignedHeaders": "content-type;host",
    "content-type": contentType,
    "host": url.host,
  };

  // Canonical query string (sorted)
  const sortedParams = Object.entries(params)
    .filter(([k]) => k !== "content-type" && k !== "host")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalRequest = [
    "PUT",
    `/${BUCKET}/${encodeURIComponent(key)}`,
    sortedParams,
    `content-type:${contentType}\nhost:${url.host}\n`,
    "content-type;host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    datetime,
    scope,
    await sha256(canonicalRequest),
  ].join("\n");

  const sig = hex(await hmac(await signingKey(date), stringToSign));

  return `${ENDPOINT}/${BUCKET}/${encodeURIComponent(key)}?${sortedParams}&X-Amz-Signature=${sig}`;
}

/** Public URL for playback/display — legacy, delegates to cdn.ts */
export function getPublicUrl(key: string | null | undefined): string {
  if (!key) return "";
  return `${R2_CDN}/${key}`;
}

/** Delete object from R2 */
export async function deleteFromR2(key: string): Promise<void> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const datetime = now.toISOString().replace(/[:-]|\.\d+/g, "").slice(0, 15) + "Z";
  const scope = `${date}/auto/s3/aws4_request`;
  const host = new URL(ENDPOINT).host;

  const canonicalRequest = [
    "DELETE",
    `/${BUCKET}/${encodeURIComponent(key)}`,
    "",
    `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${datetime}\n`,
    "host;x-amz-content-sha256;x-amz-date",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    datetime,
    scope,
    await sha256(canonicalRequest),
  ].join("\n");

  const sig = hex(await hmac(await signingKey(date), stringToSign));

  await fetch(`${ENDPOINT}/${BUCKET}/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: {
      "host": host,
      "x-amz-date": datetime,
      "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
      "Authorization": `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${scope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${sig}`,
    },
  });
}
