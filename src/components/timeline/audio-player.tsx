"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

function clock(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** A chunky player for voice recordings and sound. Keyboard and screen-reader friendly. */
export function AudioPlayer({ src, title, duration, className }: { src: string; title: string; duration?: number | null; className?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onMeta = () => Number.isFinite(el.duration) && setTotal(el.duration);
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("pause", onEnd);
    el.addEventListener("play", onPlay);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("pause", onEnd);
      el.removeEventListener("play", onPlay);
    };
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const progress = total ? Math.min(1, time / total) : 0;

  return (
    <div className={cn("field flex items-center gap-4 p-3", className)}>
      <audio ref={audio} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="press flex size-12 shrink-0 items-center justify-center bg-pink text-black"
      >
        {playing ? (
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true"><rect x="3" y="2.5" width="3.5" height="11" fill="currentColor" /><rect x="9.5" y="2.5" width="3.5" height="11" fill="currentColor" /></svg>
        ) : (
          <svg viewBox="0 0 16 16" className="ml-0.5 size-4" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 border-[length:var(--line-thin)] border-black bg-paper" />
          <div className="absolute left-0 top-1/2 h-3 -translate-y-1/2 border-[length:var(--line-thin)] border-black bg-pop" style={{ width: `${progress * 100}%` }} />
          <input
            type="range"
            min={0}
            max={total || 1}
            step={0.1}
            value={time}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (audio.current) audio.current.currentTime = t;
              setTime(t);
            }}
            aria-label={`Position in ${title}`}
            aria-valuetext={`${clock(time)} of ${clock(total)}`}
            className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-[length:var(--line-thin)] [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:bg-sun [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-[length:var(--line-thin)] [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-sun"
          />
        </div>
        <div className="flex justify-between text-caption font-bold text-ink-soft numerals-tabular">
          <span>{clock(time)}</span>
          <span>{clock(total)}</span>
        </div>
      </div>
    </div>
  );
}
