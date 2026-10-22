import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Media } from "@/lib/domain/types";
import { AudioPlayer } from "./audio-player";
import { StoryImage } from "./story-image";

/**
 * How a moment's photographs sit in the timeline. One photograph is shown
 * wide; two side by side; three or more as a lead image and a strip.
 */
export function TimelinePhotos({ images, href, title }: { images: Media[]; href: string; title: string }) {
  if (images.length === 0) return null;
  const [lead, ...rest] = images;
  const strip = rest.slice(0, 3);
  const hidden = rest.length - strip.length;

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {images.map((m) => (
          <Link key={m.id} href={href} className="block overflow-hidden rounded-frame" aria-label={`Open ${title}`}>
            <StoryImage media={m} sizes="(min-width: 1024px) 26rem, 50vw" className="aspect-[4/5] object-cover" />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <figure>
      <Link href={href} className="block overflow-hidden rounded-frame" aria-label={`Open ${title}`}>
        <StoryImage media={lead} sizes="(min-width: 1024px) 52rem, 100vw" />
      </Link>
      {strip.length ? (
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          {strip.map((m, i) => (
            <Link key={m.id} href={href} className="relative block overflow-hidden rounded-frame" aria-label={`Open ${title}`}>
              <StoryImage media={m} sizes="17rem" className="aspect-[3/2] object-cover" />
              {hidden > 0 && i === strip.length - 1 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-night/60 font-serif text-h3 text-night-ink">
                  +{hidden}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
      {lead.caption ? <figcaption className="mt-2.5 max-w-prose text-small text-ink-soft">{lead.caption}</figcaption> : null}
    </figure>
  );
}

export function MomentRecordings({ media, title, className }: { media: Media[]; title: string; className?: string }) {
  const sounds = media.filter((m) => m.kind === "audio" && m.url);
  const videos = media.filter((m) => m.kind === "video" && m.url);
  if (!sounds.length && !videos.length) return null;
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {videos.map((v) => (
        <figure key={v.id}>
          <video controls preload="metadata" playsInline className="w-full rounded-frame bg-night" src={v.url!}>
            <track kind="captions" />
          </video>
          {v.caption ? <figcaption className="mt-2 text-small text-ink-soft">{v.caption}</figcaption> : null}
        </figure>
      ))}
      {sounds.map((s) => (
        <figure key={s.id} className="max-w-xl">
          <AudioPlayer src={s.url!} title={s.caption ?? title} duration={s.durationSeconds} />
          {s.caption ? <figcaption className="mt-2 text-small text-ink-soft">{s.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
