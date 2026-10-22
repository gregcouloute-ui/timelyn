import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appMode, supabaseConfig } from "@/lib/config";

const DEMO_COOKIE = "everline_demo_user";
const PROTECTED = [/^\/stories(\/|$)/, /^\/s\//, /^\/account(\/|$)/];

function toSignIn(request: NextRequest) {
  const url = request.nextUrl.clone();
  const next = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = "/sign-in";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

/**
 * Keeps the Supabase session fresh and sends signed-out visitors to sign in
 * (remembering where they were going). This is a convenience, not the
 * security boundary: every page, action and query re-checks access next to
 * the data, and Postgres enforces Row Level Security.
 */
export async function proxy(request: NextRequest) {
  const isProtected = PROTECTED.some((p) => p.test(request.nextUrl.pathname));
  const config = supabaseConfig();

  if (appMode() !== "supabase" || !config) {
    if (isProtected && !request.cookies.get(DEMO_COOKIE)) return toSignIn(request);
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Verifies the JWT and refreshes the session if it has expired.
  const { data } = await supabase.auth.getClaims();
  if (isProtected && !data?.claims) return toSignIn(request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|demo/|api/demo/media|.*\\.(?:svg|png|jpg|jpeg|webp|wav|woff2)$).*)"],
};
