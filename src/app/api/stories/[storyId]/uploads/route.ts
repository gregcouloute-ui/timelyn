import { NextResponse } from "next/server";
import { z } from "zod";
import { apiStoryContext, jsonError, sameOrigin, statusFor } from "@/lib/api";
import { describeError } from "@/lib/services/errors";
import { requestUpload } from "@/lib/services/media";

const body = z.object({ mimeType: z.string().max(100), sizeBytes: z.number().int().positive() });

/** Step one of an upload: checks permission and limits, returns where to send the bytes. */
export async function POST(request: Request, ctx: RouteContext<"/api/stories/[storyId]/uploads">) {
  if (!sameOrigin(request)) return jsonError(403, "Cross-site request refused.");
  const { storyId } = await ctx.params;
  if (!z.uuid().safeParse(storyId).success) return jsonError(404, "Story not found.");
  const context = await apiStoryContext(storyId);
  if ("error" in context) return context.error;

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Send the file's type and size.");
  try {
    const ticket = await requestUpload(context.repo, context.access, parsed.data);
    return NextResponse.json(ticket, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(statusFor(error), describeError(error));
  }
}
