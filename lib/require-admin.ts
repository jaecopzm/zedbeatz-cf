import { NextResponse } from "next/server";

// Admin-only guard via shared secret. Callers must send
// `x-admin-secret: <ADMIN_SECRET>`. No user auth.
export async function requireAdmin(req?: Request): Promise<NextResponse | null> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  const got = req?.headers.get("x-admin-secret");
  if (got !== secret) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
