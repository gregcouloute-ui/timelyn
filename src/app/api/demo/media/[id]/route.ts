import { z } from "zod";
import { jsonError } from "@/lib/api";
import { getViewer } from "@/lib/auth/session";
import { isDemo } from "@/lib/config";
import { demoRepository } from "@/lib/data/demo/store";
import { can } from "@/lib/domain/permissions";

/** Demo mode only: serves uploaded files to people allowed to see them. */
export async function GET(_request: Request, ctx: RouteContext<"/api/demo/media/[id]">) {
  if (!isDemo()) return jsonError(404, "Not found.");
  const viewer = await getViewer();
  if (!viewer) return jsonError(401, "Sign in to continue.");
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found.");

  const row = demoRepository.getMediaRow(id);
  if (!row) return jsonError(404, "Not found.");
  const role = await demoRepository.getRole(row.storyId, viewer.id);
  const moment = row.momentId ? await demoRepository.getMoment(row.momentId) : null;
  const visible =
    can.review(role) ||
    (row.uploadedBy === viewer.id && role !== null) ||
    (moment ? can.seeMoment(role, viewer.id, moment) : row.purpose === "cover" && role !== null);
  if (!visible) return jsonError(404, "Not found.");

  const blob = demoRepository.readBlob(row.path);
  if (!blob) return jsonError(404, "Not found.");
  // Serve with the validated type recorded at upload, never a client-supplied one.
  return new Response(new Blob([blob.bytes as BlobPart], { type: row.mimeType }), {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
