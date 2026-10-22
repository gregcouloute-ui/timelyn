"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button, Spinner } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Media, MediaKind } from "@/lib/domain/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface UploadConfig {
  mode: "supabase" | "demo";
  supabaseUrl?: string;
  supabaseKey?: string;
  bucket: string;
}

interface Item {
  key: string;
  kind: MediaKind;
  name: string;
  previewUrl: string | null;
  status: "uploading" | "ready" | "error";
  error?: string;
  mediaId?: string;
  caption: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/webm,audio/ogg";

function kindOf(type: string): MediaKind | null {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return null;
}

async function readDimensions(file: File, kind: MediaKind) {
  try {
    if (kind === "image") {
      const bitmap = await createImageBitmap(file);
      const out = { width: bitmap.width, height: bitmap.height, durationSeconds: null };
      bitmap.close();
      return out;
    }
    const url = URL.createObjectURL(file);
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";
    el.src = url;
    const meta = await new Promise<{ width: number | null; height: number | null; durationSeconds: number | null }>((resolve) => {
      el.onloadedmetadata = () =>
        resolve({
          width: kind === "video" ? (el as HTMLVideoElement).videoWidth || null : null,
          height: kind === "video" ? (el as HTMLVideoElement).videoHeight || null : null,
          durationSeconds: Number.isFinite(el.duration) ? el.duration : null,
        });
      el.onerror = () => resolve({ width: null, height: null, durationSeconds: null });
    });
    URL.revokeObjectURL(url);
    return meta;
  } catch {
    return { width: null, height: null, durationSeconds: null };
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "The upload didn't work. Try again.");
  return data as T;
}

interface Ticket {
  mediaId: string;
  path: string;
  strategy: "supabase-signed" | "demo";
  token?: string;
  uploadUrl?: string;
}

/**
 * Adds photographs, video and sound to a moment. Files go straight to
 * storage; only their references are submitted with the form.
 */
export function MediaUploader({
  storyId,
  config,
  initial,
  onBusyChange,
}: {
  storyId: string;
  config: UploadConfig;
  initial: Media[];
  onBusyChange: (busy: boolean) => void;
}) {
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((m) => ({
      key: m.id,
      kind: m.kind,
      name: m.caption ?? m.kind,
      previewUrl: m.url,
      status: "ready",
      mediaId: m.id,
      caption: m.caption ?? "",
    })),
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = items.some((i) => i.status === "uploading");

  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const update = (key: string, patch: Partial<Item>) => setItems((all) => all.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const upload = useCallback(
    async (file: File, key: string, kind: MediaKind) => {
      try {
        const ticket = await postJson<Ticket>(`/api/stories/${storyId}/uploads`, { mimeType: file.type, sizeBytes: file.size });
        if (ticket.strategy === "demo") {
          const res = await fetch(ticket.uploadUrl!, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "The upload didn't finish.");
        } else {
          const client = getSupabaseBrowserClient(config.supabaseUrl!, config.supabaseKey!);
          const { error } = await client.storage.from(config.bucket).uploadToSignedUrl(ticket.path, ticket.token!, file, {
            contentType: file.type,
          });
          if (error) throw new Error("The upload didn't finish. Check your connection and try again.");
        }
        const dims = await readDimensions(file, kind);
        const media = await postJson<Media>(`/api/stories/${storyId}/uploads/complete`, {
          mediaId: ticket.mediaId,
          path: ticket.path,
          mimeType: file.type,
          sizeBytes: file.size,
          ...dims,
        });
        update(key, { status: "ready", mediaId: media.id });
      } catch (e) {
        update(key, { status: "error", error: e instanceof Error ? e.message : "The upload didn't work." });
      }
    },
    [storyId, config],
  );

  const addFiles = (files: FileList | File[]) => {
    const next: Item[] = [];
    for (const file of Array.from(files)) {
      const kind = kindOf(file.type);
      const key = crypto.randomUUID();
      if (!kind) {
        next.push({ key, kind: "image", name: file.name, previewUrl: null, status: "error", error: "This type of file isn't supported.", caption: "" });
        continue;
      }
      const previewable = kind === "image" && !/hei[cf]/.test(file.type);
      next.push({ key, kind, name: file.name, previewUrl: previewable ? URL.createObjectURL(file) : null, status: "uploading", caption: "" });
      void upload(file, key, kind);
    }
    setItems((all) => [...all, ...next]);
  };

  const remove = (key: string) => setItems((all) => all.filter((i) => i.key !== key));
  const move = (key: string, dir: -1 | 1) =>
    setItems((all) => {
      const i = all.findIndex((x) => x.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= all.length) return all;
      const copy = [...all];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Submitted from state, so React's post-action form reset can't clear them. */}
      {items
        .filter((i) => i.status === "ready" && i.mediaId)
        .map((i) => (
          <span key={i.key} hidden>
            <input type="hidden" name="mediaIds" value={i.mediaId} />
            <input type="hidden" name={`caption:${i.mediaId}`} value={i.caption} />
          </span>
        ))}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-start gap-4 rounded-soft border border-dashed px-5 py-6 transition-colors sm:flex-row sm:items-center sm:justify-between",
          dragging ? "border-cyan bg-cyan-wash" : "border-rule-strong bg-paper-raised",
        )}
      >
        <div>
          <p className="text-ui font-medium text-ink">Photographs, video and sound</p>
          <p className="mt-0.5 text-small text-ink-soft">
            Drop files here, or choose them. Photos up to 25 MB, recordings up to 50 MB, video up to 200 MB.
            {config.mode === "demo" ? " In demo mode, files up to 12 MB are kept in memory only." : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            Choose files
          </Button>
          <VoiceRecorder onRecorded={(file) => addFiles([file])} />
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {busy ? "Uploading files." : items.length ? `${items.filter((i) => i.status === "ready").length} files ready.` : ""}
      </p>

      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.li
              key={item.key}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-soft border border-rule bg-paper-raised p-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-frame bg-paper-sunk">
                {item.previewUrl && item.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-caption text-ink-soft">
                    {item.kind === "audio" ? "Sound" : item.kind === "video" ? "Video" : "Photo"}
                  </span>
                )}
                {item.status === "uploading" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-paper/70 text-ink">
                    <Spinner />
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                {item.status === "error" ? (
                  <p className="text-small text-danger" role="alert">
                    {item.name}: {item.error}
                  </p>
                ) : (
                  <>
                    <label htmlFor={`caption-${item.key}`} className="text-small text-ink-soft">
                      {item.status === "uploading" ? `Uploading ${item.name}…` : "Caption"}
                    </label>
                    <input
                      id={`caption-${item.key}`}
                      value={item.caption}
                      maxLength={300}
                      onChange={(e) => update(item.key, { caption: e.target.value })}
                      placeholder="Who, where, when"
                      className="mt-1 w-full border-b border-rule bg-transparent py-1.5 text-ui text-ink placeholder:text-ink-faint focus:border-cyan focus:outline-none"
                    />
                  </>
                )}
              </div>
              <div className="col-span-2 flex items-center gap-1 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center">
                {items.length > 1 && item.status === "ready" ? (
                  <>
                    <button type="button" onClick={() => move(item.key, -1)} disabled={index === 0} className="rounded-sm px-2 py-1 text-small text-ink-soft hover:text-ink disabled:opacity-30">
                      Move up
                    </button>
                    <button type="button" onClick={() => move(item.key, 1)} disabled={index === items.length - 1} className="rounded-sm px-2 py-1 text-small text-ink-soft hover:text-ink disabled:opacity-30">
                      Move down
                    </button>
                  </>
                ) : null}
                <button type="button" onClick={() => remove(item.key)} className="rounded-sm px-2 py-1 text-small text-danger hover:underline">
                  Remove
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/** Records a voice note in the browser, for stories best told aloud. */
function VoiceRecorder({ onRecorded }: { onRecorded: (file: File) => void }) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => Boolean(navigator.mediaDevices) && typeof MediaRecorder !== "undefined",
    () => false,
  );
  const [state, setState] = useState<"idle" | "recording" | "denied">("idle");
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  if (!supported) return null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const mime = (rec.mimeType || "audio/webm").split(";")[0];
        const ext = mime === "audio/mp4" ? "m4a" : mime === "audio/ogg" ? "ogg" : "webm";
        onRecorded(new File(chunks, `Voice note.${ext}`, { type: mime }));
        if (timer.current) clearInterval(timer.current);
        setSeconds(0);
        setState("idle");
      };
      recorder.current = rec;
      rec.start();
      setState("recording");
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setState("denied");
    }
  };

  if (state === "recording") {
    return (
      <Button type="button" size="sm" variant="danger" onClick={() => recorder.current?.stop()}>
        <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-paper" />
        Stop recording {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </Button>
    );
  }
  return (
    <Button type="button" variant="secondary" size="sm" onClick={start} title={state === "denied" ? "Allow microphone access in your browser to record." : undefined}>
      {state === "denied" ? "Microphone blocked" : "Record a voice note"}
    </Button>
  );
}
