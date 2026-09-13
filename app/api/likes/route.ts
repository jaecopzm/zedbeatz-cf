import { NextResponse } from "next/server";

// Likes are local-only (localStorage) — no user auth. Backend kept as stub.
export async function GET() {
  return NextResponse.json({ liked: false, likedIds: [] });
}

export async function POST() {
  return NextResponse.json({ error: "Likes are local-only" }, { status: 410 });
}
