import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// No user auth — public site. Admin API routes are guarded by
// x-admin-secret via lib/require-admin.ts. Admin UI handles its own
// secret prompt (localStorage), so middleware stays a pass-through.
export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
