import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isLibraryRoute = createRouteMatcher(["/library(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isLibraryRoute(req)) {
    await auth.protect();
  }

  if (isAdminRoute(req)) {
    const session = await auth();

    if (!session.userId) {
      await auth.protect();
    }

    const metadata = session.sessionClaims?.metadata as any;
    const isAdmin =
      metadata?.role === "admin" ||
      (process.env.ADMIN_USER_ID && session.userId === process.env.ADMIN_USER_ID);

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
