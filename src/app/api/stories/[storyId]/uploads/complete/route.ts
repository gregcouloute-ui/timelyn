import { NextResponse } from "next/server";
import { z } from "zod";
import { apiStoryContext, jsonError, sameOrigin, statusFor } from "@/lib/api";
import { describeError } from "@/lib/services/errors";
import { completeUpload } from "@/lib/services/media";

const body = z.object({
  mediaId: z.uuid(),
  path: z.string().max(200),
  mimeType: z.string().max(100),
  sizeBytes: z.number().int().positive(),
  width: z.number().nullable().default(null),
  height: z.number().nullable().default(null),
  durationSeconds: z.number().nullable().default(null),
});

/** Step two: confirms the bytes arrived and records the file against the story. */
export async function POST(request: Request, ctx: RouteContext<"/api/stories/[storyId]/uploads/complete">) {
  if (!sameOrigin(request)) return jsonError(403, "Cross-site request refused.");
  const { storyId } = await ctx.params;
  if (!z.uuid().safeParse(storyId).success) return jsonError(404, "Story not found.");
  const context = await apiStoryContext(storyId);
  if ("error" in context) return context.error;

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "The upload details were incomplete.");
  try {
    const media = await completeUpload(context.repo, context.access, context.viewer, parsed.data);
    return NextResponse.json(media, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(statusFor(error), describeError(error));
  }
}
