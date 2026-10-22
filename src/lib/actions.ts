import "server-only";
import { getRepository, requireViewer } from "@/lib/auth/session";
import { describeError } from "@/lib/services/errors";
import { accessStory } from "@/lib/services/stories";
import type { FormState } from "@/lib/validation";

/** Re-establishes who is acting and on which story. Never trust the client. */
export async function storyContext(slug: string) {
  const viewer = await requireViewer(`/s/${slug}`);
  const repo = await getRepository();
  const access = await accessStory(repo, viewer, slug);
  return { viewer, repo, access };
}

export function failure(error: unknown, formData?: FormData): FormState {
  const values: Record<string, string> = {};
  if (formData) {
    for (const [k, v] of formData.entries()) if (typeof v === "string" && !k.startsWith("$ACTION")) values[k] = v;
  }
  return { status: "error", message: describeError(error), fieldErrors: {}, values };
}
