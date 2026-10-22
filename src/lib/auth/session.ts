import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { appMode } from "@/lib/config";
import { demoRepository } from "@/lib/data/demo/store";
import type { Repository } from "@/lib/data/repository";
import { SupabaseRepository } from "@/lib/data/supabase/repository";
import type { Viewer } from "@/lib/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const DEMO_COOKIE = "everline_demo_user";

/** The data layer for this request, acting as the signed-in person. */
export const getRepository = cache(async (): Promise<Repository> => {
  if (appMode() === "demo") return demoRepository;
  return new SupabaseRepository(await createSupabaseServerClient());
});

/** The signed-in person, or null. Verified on every request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (appMode() === "demo") {
    const id = (await cookies()).get(DEMO_COOKIE)?.value;
    const user = id ? demoRepository.findUser(id) : null;
    return user ? { id: user.id, displayName: user.displayName, email: user.email } : null;
  }

  const supabase = await createSupabaseServerClient();
  // getClaims verifies the JWT signature; getSession alone would not.
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", claims.sub).maybeSingle();
  const email = typeof claims.email === "string" ? claims.email : null;
  return {
    id: claims.sub,
    displayName: (profile?.display_name as string | undefined) ?? email?.split("@")[0] ?? "You",
    email,
  };
});

export async function requireViewer(returnTo?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(returnTo ? `/sign-in?next=${encodeURIComponent(returnTo)}` : "/sign-in");
  return viewer;
}

/** Only allows same-site relative paths, to prevent open redirects. */
export function safeNext(next: unknown, fallback = "/stories"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
