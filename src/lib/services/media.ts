import { randomUUID } from "node:crypto";
import { DEMO_MAX_UPLOAD_BYTES, MEDIA_LIMITS, appMode } from "@/lib/config";
import type { Repository, UploadTarget } from "@/lib/data/repository";
import { can } from "@/lib/domain/permissions";
import type { Media, MediaKind, Viewer } from "@/lib/domain/types";
import { ServiceError, forbidden } from "./errors";
import type { StoryAccess } from "./stories";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "weba",
  "audio/ogg": "ogg",
};

export function kindForMime(mimeType: string): MediaKind | null {
  for (const kind of ["image", "video", "audio"] as const) {
    if ((MEDIA_LIMITS[kind].types as readonly string[]).includes(mimeType)) return kind;
  }
  return null;
}

function formatMb(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export interface UploadRequest {
  mimeType: string;
  sizeBytes: number;
}

export interface UploadTicket extends UploadTarget {
  mediaId: string;
  kind: MediaKind;
}

export async function requestUpload(
  repo: Repository,
  access: StoryAccess,
  request: UploadRequest,
): Promise<UploadTicket> {
  if (!can.contribute(access.role)) throw forbidden("Only contributors can add files to this story.");
  const kind = kindForMime(request.mimeType);
  if (!kind) {
    throw new ServiceError("invalid", "That type of file isn't supported. Use a photo (JPEG, PNG, HEIC), video (MP4, MOV) or audio (MP3, M4A, WAV).");
  }
  const limit = appMode() === "demo" ? Math.min(DEMO_MAX_UPLOAD_BYTES, MEDIA_LIMITS[kind].maxBytes) : MEDIA_LIMITS[kind].maxBytes;
  if (!Number.isFinite(request.sizeBytes) || request.sizeBytes <= 0) {
    throw new ServiceError("invalid", "That file appears to be empty.");
  }
  if (request.sizeBytes > limit) {
    throw new ServiceError("invalid", `That file is ${formatMb(request.sizeBytes)}. The limit for ${kind === "image" ? "photographs" : kind === "video" ? "videos" : "recordings"} is ${formatMb(limit)}.`);
  }
  const mediaId = randomUUID();
  const path = `${access.story.id}/${mediaId}.${EXTENSIONS[request.mimeType] ?? "bin"}`;
  const target = await repo.createUploadTarget(access.story.id, mediaId, path);
  return { ...target, mediaId, kind };
}

export interface CompleteUpload {
  mediaId: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}

export async function completeUpload(
  repo: Repository,
  access: StoryAccess,
  viewer: Viewer,
  upload: CompleteUpload,
): Promise<Media> {
  if (!can.contribute(access.role)) throw forbidden();
  const kind = kindForMime(upload.mimeType);
  const expectedPrefix = `${access.story.id}/${upload.mediaId}.`;
  if (!kind || !upload.path.startsWith(expectedPrefix) || upload.path.includes("..")) {
    throw new ServiceError("invalid", "That upload doesn't match this story.");
  }
  if (!(await repo.confirmUpload(upload.path))) {
    throw new ServiceError("invalid", "The file didn't finish uploading. Try adding it again.");
  }
  const dim = (n: number | null) => (n && Number.isFinite(n) && n > 0 && n < 100_000 ? Math.round(n) : null);
  return repo.createMedia({
    id: upload.mediaId,
    storyId: access.story.id,
    kind,
    path: upload.path,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
    width: dim(upload.width),
    height: dim(upload.height),
    durationSeconds:
      upload.durationSeconds && Number.isFinite(upload.durationSeconds) && upload.durationSeconds > 0
        ? Math.round(upload.durationSeconds * 100) / 100
        : null,
    uploadedBy: viewer.id,
  });
}
