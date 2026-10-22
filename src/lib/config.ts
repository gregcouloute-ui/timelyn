/**
 * Runtime mode.
 *
 * Everline runs against Supabase when credentials are configured. Without
 * them it starts in a clearly labelled local demonstration mode, backed by an
 * in-memory store seeded with a sample family. Demo mode never claims to
 * persist anything: changes last only as long as the server process.
 */

export type AppMode = "supabase" | "demo";

export function supabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function appMode(): AppMode {
  if (process.env.EVERLINE_FORCE_DEMO === "true") return "demo";
  return supabaseConfig() ? "supabase" : "demo";
}

export const isDemo = () => appMode() === "demo";

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const MEDIA_BUCKET = "story-media";

export const MEDIA_LIMITS = {
  image: { maxBytes: 25 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"] },
  video: { maxBytes: 200 * 1024 * 1024, types: ["video/mp4", "video/quicktime", "video/webm"] },
  audio: { maxBytes: 50 * 1024 * 1024, types: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg"] },
} as const;

/** Demo mode keeps uploads in memory, so it caps them more tightly. */
export const DEMO_MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
