"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The 41-second explainer. Plays silently on arrival (captions are part of
 * the picture), unless the visitor prefers reduced motion. Tap for sound.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().catch(() => {
      /* autoplay blocked: the poster and controls remain */
    });
  }, []);

  const withSound = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = false;
    video.currentTime = 0;
    void video.play();
    setMuted(false);
  };

  return (
    <figure className="brutal-lg relative overflow-hidden bg-paper-raised">
      <video
        ref={ref}
        className="block aspect-video w-full bg-black"
        src="/timelyn-explainer.mp4"
        poster="/timelyn-explainer-poster.jpg"
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label="A 41-second video explaining TimeLyn"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-small font-bold">What is TimeLyn? 41 seconds.</p>
        {muted ? (
          <button
            type="button"
            onClick={withSound}
            className="press flex h-10 items-center gap-2 bg-sun px-4 text-small font-bold text-black"
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
              <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
              <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            Watch with sound
          </button>
        ) : null}
      </div>
      <figcaption className="sr-only">
        TimeLyn gathers a family&rsquo;s scattered photos and memories into one person&rsquo;s life story, in date order.
        You start a story for someone, invite the family to add what they remember, and approve each addition before it
        appears.
      </figcaption>
    </figure>
  );
}
