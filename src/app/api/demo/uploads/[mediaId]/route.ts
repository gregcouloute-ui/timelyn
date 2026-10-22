import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, sameOrigin } from "@/lib/api";
import { getViewer } from "@/lib/auth/session";
import { DEMO_MAX_UPLOAD_BYTES, isDemo } from "@/lib/config";
import { demoRepository } from "@/lib/data/demo/store";
import { atLeast } from "@/lib/domain/permissions";

/** Demo mode only: receives file bytes into memory. */
export async function PUT(request: Request, ctx: RouteContext<"/api/demo/uploads/[mediaId]">) {
  if (!isDemo()) return jsonError(404, "Not found.");
  if (!sameOrigin(request)) return jsonError(403, "Cross-site request refused.");
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in to continue.");

  const { mediaId } = await ctx.params;
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const [storyId, file] = path.split("/");
  if (!z.uuid().safeParse(mediaId).success || !z.uuid().safeParse(storyId).success || !file?.startsWith(`${mediaId}.`)) {
    return jsonError(400, "Invalid upload.");
  }
  if (!atLeast(await demoRepository.getRole(storyId, viewer.id), "contributor")) return jsonError(403, "You can't add files to this story.");

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > DEMO_MAX_UPLOAD_BYTES) return jsonError(413, "That file is too large for demo mode.");
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > DEMO_MAX_UPLOAD_BYTES) return jsonError(413, "That file is too large for demo mode.");

  const stored = demoRepository.storeUpload(path, bytes, request.headers.get("content-type") ?? "application/octet-stream");
  if (!stored) return jsonError(409, "This upload has expired. Add the file again.");
  return NextResponse.json({ ok: true });
}
