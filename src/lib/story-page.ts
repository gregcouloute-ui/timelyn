import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getRepository, requireViewer } from "@/lib/auth/session";
import { MEDIA_BUCKET, appMode, supabaseConfig } from "@/lib/config";
import { ServiceError } from "@/lib/services/errors";
import { accessStory } from "@/lib/services/stories";

/**
 * Loads the story behind a /s/[slug] route for the signed-in viewer, once per
 * request. Anything the viewer can't access is a plain 404.
 */
export const loadStoryPage = cache(async (slug: string) => {
  const viewer = await requireViewer(`/s/${slug}`);
  const repo = await getRepository();
  try {
    const access = await accessStory(repo, viewer, slug);
    return { viewer, repo, ...access };
  } catch (error) {
    if (error instanceof ServiceError && error.code === "not_found") notFound();
    throw error;
  }
});

/** What the browser needs to send files to storage. The key is the public anon key. */
export function uploadConfig() {
  const supabase = supabaseConfig();
  return appMode() === "supabase" && supabase
    ? { mode: "supabase" as const, supabaseUrl: supabase.url, supabaseKey: supabase.anonKey, bucket: MEDIA_BUCKET }
    : { mode: "demo" as const, bucket: MEDIA_BUCKET };
}
