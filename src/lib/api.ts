import "server-only";
import { NextResponse } from "next/server";
import { getRepository, getViewer } from "@/lib/auth/session";
import { RepositoryError } from "@/lib/data/repository";
import { ServiceError, describeError } from "@/lib/services/errors";
import { accessStoryById } from "@/lib/services/stories";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function statusFor(error: unknown) {
  const code = error instanceof ServiceError || error instanceof RepositoryError ? error.code : "unavailable";
  return { not_found: 404, forbidden: 403, conflict: 409, invalid: 422, unavailable: 500 }[code];
}

/** Authenticates the caller and resolves their access to a story, for route handlers. */
export async function apiStoryContext(storyId: string) {
  const viewer = await getViewer();
  if (!viewer) return { error: jsonError(401, "Sign in to continue.") } as const;
  const repo = await getRepository();
  try {
    const access = await accessStoryById(repo, viewer, storyId);
    return { viewer, repo, access } as const;
  } catch (error) {
    return { error: jsonError(statusFor(error), describeError(error)) } as const;
  }
}

/** Rejects cross-site requests to state-changing endpoints. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host || origin === process.env.NEXT_PUBLIC_SITE_URL;
  } catch {
    return false;
  }
}
