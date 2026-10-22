import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/session";
import { appMode } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Completes email confirmation and password-reset links from Supabase Auth. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const fail = NextResponse.redirect(new URL("/sign-in?error=link", url.origin));
  if (appMode() !== "supabase") return fail;

  const supabase = await createSupabaseServerClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail;
  } else {
    return fail;
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
