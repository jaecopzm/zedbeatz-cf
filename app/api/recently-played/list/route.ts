import { NextResponse } from "next/server";

// Personal history removed with user auth.
export async function GET() {
  return NextResponse.json({ tracks: [] });
}
