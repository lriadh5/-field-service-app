import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/config";

/** Fast redirect for signed-out visitors. Real checks happen on the server in each page. */
export function proxy(request: NextRequest) {
  if (!request.cookies.get(SESSION_COOKIE)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/admin/:path*"] };
