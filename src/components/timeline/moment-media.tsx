import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Media } from "@/lib/domain/types";
import { AudioPlayer } from "./audio-player";
import { StoryImage } from "./story-image";

/**
 * A moment's photographs inside its card. One photograph runs edge to edge;
 * two sit side by side; three or more become a lead image and a strip.
 */
export function TimelinePhotos({ images, href, title }: { images: Media[]; href: string; title: string }) {
  if (images.length === 0) return null;
  const [lead, ...rest] = images;
  const strip = rest.slice(0, 3);
  const hidden = rest.length - strip.length;

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 border-b-[3px] border-black">
        {images.map((m, i) => (
          <Link key={m.id} href={href} className={cn("block overflow-hidden", i === 0 && "border-r-[3px] border-black")} aria-label={`Open ${title}`}>
            <StoryImage media={m} sizes="(min-width: 1024px) 23rem, 50vw" className="aspect-[4/5] object-cover" />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <figure className="border-b-[3px] border-black">
      <Link href={href} className="block overflow-hidden" aria-label={`Open ${title}`}>
        <StoryImage media={lead} sizes="(min-width: 1024px) 46rem, 100vw" />
      </Link>
      {strip.length ? (
        <div className="grid grid-cols-3 border-t-[3px] border-black">
          {strip.map((m, i) => (
            <Link key={m.id} href={href} className={cn("relative block overflow-hidden", i < strip.length - 1 && "border-r-[3px] border-black")} aria-label={`Open ${title}`}>
              <StoryImage media={m} sizes="15rem" className="aspect-[3/2] object-cover" />
              {hidden > 0 && i === strip.length - 1 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 font-display text-h3 text-white">+{hidden}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
      {lead.caption ? (
        <figcaption className="border-t-[3px] border-black bg-paper-sunk px-4 py-2 text-small text-ink-soft">{lead.caption}</figcaption>
      ) : null}
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
          <video controls preload="metadata" playsInline className="w-full border-[3px] border-black bg-black" src={v.url!}>
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
