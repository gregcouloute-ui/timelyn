import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Media } from "@/lib/domain/types";

/**
 * Local demo plates go through Next's image optimiser. Family uploads are
 * served from short-lived signed URLs, so they are shown as-is.
 */
export function StoryImage({
  media,
  sizes,
  className,
  priority,
  alt,
}: {
  media: Media;
  sizes: string;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  if (!media.url) {
    return <div className={cn("bg-paper-sunk", className)} aria-label="Image unavailable" role="img" />;
  }
  // Only the bundled demo plates are public; everything else needs the
  // viewer's own session, which the image optimiser would not have.
  const local = media.url.startsWith("/demo/");
  return (
    <Image
      src={media.url}
      alt={alt ?? media.caption ?? ""}
      width={media.width ?? 1600}
      height={media.height ?? 1067}
      sizes={sizes}
      priority={priority}
      unoptimized={!local}
      className={cn("h-auto w-full bg-paper-sunk", className)}
    />
  );
}
