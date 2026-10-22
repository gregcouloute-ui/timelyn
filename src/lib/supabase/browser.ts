"use client";
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Browser client, used only to send file bytes to signed upload URLs. */
export function getSupabaseBrowserClient(url: string, anonKey: string) {
  if (!client) client = createBrowserClient(url, anonKey);
  return client;
}
