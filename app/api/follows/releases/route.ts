import { NextResponse } from "next/server";

// Release radar removed with user auth — no follows.
export async function GET() {
  return NextResponse.json({ tracks: [] });
}
