import { db } from "@/lib/db/drizzle";
import { comments } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Comments are read-only for now. Posting removed with user auth.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const track_id = searchParams.get("track_id");

  if (!track_id) {
    return NextResponse.json({ error: "Missing track_id" }, { status: 400 });
  }

  const data = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      userName: comments.userName,
      content: comments.content,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(eq(comments.trackId, parseInt(track_id)))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return NextResponse.json({ comments: data });
}

export async function POST() {
  return NextResponse.json({ error: "Comments are paused" }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Comments are paused" }, { status: 410 });
}
