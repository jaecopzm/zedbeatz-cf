import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  const metadata = session.sessionClaims?.metadata as { role?: string } | undefined;
  const isAdmin =
    metadata?.role === "admin" ||
    (process.env.ADMIN_USER_ID && session.userId === process.env.ADMIN_USER_ID);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
