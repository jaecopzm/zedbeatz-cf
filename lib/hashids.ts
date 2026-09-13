import Hashids from "hashids";

const SALT = process.env.NEXT_PUBLIC_HASHIDS_SALT || process.env.HASHIDS_SALT || "zedbeatz-2026-salt";
const MIN_LENGTH = 8;
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

const hashids = new Hashids(SALT, MIN_LENGTH, ALPHABET);

export function encodeId(id: number): string {
  return hashids.encode(id);
}

export function decodeId(hash: string): number | null {
  const decoded = hashids.decode(hash);
  if (decoded.length === 1 && typeof decoded[0] === "number") return decoded[0];
  return null;
}

export function isHashId(s: string): boolean {
  return decodeId(s) !== null;
}

/**
 * Resolve a route param that may be hashid, numeric id, or slug.
 * Returns { kind, numericId } for DB lookup. For slug, numericId is null — caller should lookup by slug.
 */
export function resolveIdParam(param: string): { kind: "hashid" | "numeric" | "slug"; numericId: number | null } {
  // numeric
  if (/^\d+$/.test(param)) return { kind: "numeric", numericId: Number(param) };
  const dec = decodeId(param);
  if (dec !== null) return { kind: "hashid", numericId: dec };
  return { kind: "slug", numericId: null };
}

export function toHashIdParam(id: number): string {
  return encodeId(id);
}
