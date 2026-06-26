import { clerkMiddleware } from "@clerk/nextjs/server";

// Everything is publicly viewable (anyone can browse the map and read
// contributions). Auth is enforced inside the mutation route handlers
// (POST /api/places, POST /api/contributions) via `auth()`. We still run
// clerkMiddleware so that auth context is available to those handlers and
// to server components.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
