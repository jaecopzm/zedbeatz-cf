import { db } from "@/lib/db/drizzle";
import { comments } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const userName =
    user?.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : user?.username ?? "Anonymous";

  const { track_id, content } = await req.json();

  if (!track_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (content.trim().length > 500) {
    return NextResponse.json({ error: "Comment too long (max 500 chars)" }, { status: 400 });
  }

  const [data] = await db
    .insert(comments)
    .values({ trackId: track_id, userId, userName, content: content.trim() })
    .returning();

  return NextResponse.json({ comment: data });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db
    .delete(comments)
    .where(and(eq(comments.id, id), eq(comments.userId, userId)));

  return NextResponse.json({ ok: true });
}
