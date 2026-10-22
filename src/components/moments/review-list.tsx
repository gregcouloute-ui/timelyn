"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useRef, useState } from "react";
import { MomentRecordings } from "@/components/timeline/moment-media";
import { StoryImage } from "@/components/timeline/story-image";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { formatPartialDate } from "@/lib/domain/dates";
import type { Moment, ReviewDecision } from "@/lib/domain/types";
import { listJoin, lowerFirst, paragraphs } from "@/lib/text";
import { idle, type FormState } from "@/lib/validation";

type ReviewFn = (prev: FormState, formData: FormData) => Promise<FormState>;

function since(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function ReviewCard({ moment, action, onReviewed }: { moment: Moment; action: ReviewFn; onReviewed: (message: string) => void }) {
  const [state, formAction, pending] = useActionState(action, idle);
  const [mode, setMode] = useState<ReviewDecision | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const images = moment.media.filter((m) => m.kind === "image");

  useEffect(() => {
    if (state.status === "success") onReviewed(state.message);
  }, [state, onReviewed]);

  useEffect(() => {
    if (mode && mode !== "publish") noteRef.current?.focus();
  }, [mode]);

  const error = state.status === "error" ? (state.fieldErrors.note ?? state.message) : null;

  return (
    <motion.article
      layout
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
      className="brutal mb-8 grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12"
      aria-labelledby={`review-${moment.id}`}
    >
      <div className="min-w-0">
        <p className="text-small text-ink-soft">
          {formatPartialDate(moment.date)}
          {moment.place ? `, ${moment.place}` : ""}
        </p>
        <h2 id={`review-${moment.id}`} className="mt-1.5 text-h3">
          {moment.title}
        </h2>
        <p className="mt-2 text-small text-ink-soft">
          From {moment.contributorName}
          {moment.contributorRelationship ? `, ${lowerFirst(moment.contributorRelationship)}` : ""}, {since(moment.updatedAt)}
        </p>
        {images.length ? (
          <div className="mt-5 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-3">
            {images.map((m) => (
              <figure key={m.id}>
                <div className="overflow-hidden border-[3px] border-black">
                  <StoryImage media={m} sizes="14rem" className="aspect-[4/3] object-cover" />
                </div>
                {m.caption ? <figcaption className="mt-1 text-caption text-ink-soft">{m.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        ) : null}
        <MomentRecordings media={moment.media} title={moment.title} className="mt-5 max-w-xl" />
        {moment.body ? (
          <div className="prose-story mt-5 text-body">
            {paragraphs(moment.body).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-ui text-ink-faint">No written story with this one.</p>
        )}
        {moment.people.length ? <p className="mt-4 text-small text-ink-soft">With {listJoin(moment.people)}.</p> : null}
      </div>

      <form action={formAction} className="flex flex-col gap-4 self-start border-[3px] border-black bg-paper-sunk p-4 lg:sticky lg:top-6">
        <input type="hidden" name="momentId" value={moment.id} />
        <input type="hidden" name="decision" value={mode ?? "publish"} />
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-ui font-bold text-ink">
          <input type="checkbox" name="isMilestone" className="size-5 accent-black" defaultChecked={moment.isMilestone} />
          Mark as a milestone
        </label>

        <AnimatePresence initial={false}>
          {mode === "request_changes" || mode === "decline" ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <label htmlFor={`note-${moment.id}`} className="text-ui font-bold text-ink">
                {mode === "request_changes" ? `What should ${moment.contributorName.split(" ")[0]} change?` : "A note for them"}
                {mode === "decline" ? <span className="ml-1.5 font-normal text-ink-faint">(optional)</span> : null}
              </label>
              <textarea
                ref={noteRef}
                id={`note-${moment.id}`}
                name="note"
                rows={4}
                maxLength={1000}
                aria-invalid={Boolean(error) || undefined}
                className="mt-1.5 w-full border-[3px] border-black bg-paper px-3 py-2 text-ui text-ink focus:shadow-[4px_4px_0_var(--pop)] focus:outline-none"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {error ? <FormMessage tone="error">{error}</FormMessage> : null}

        {mode === null || mode === "publish" ? (
          <div className="flex flex-col gap-2.5">
            <Button type="submit" pending={pending} onClick={() => setMode("publish")}>
              Publish to the story
            </Button>
            <div className="flex gap-2.5">
              <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => setMode("request_changes")}>
                Ask for changes
              </Button>
              <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => setMode("decline")}>
                Decline
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <Button type="submit" pending={pending} variant={mode === "decline" ? "danger" : "primary"} className="flex-1">
              {mode === "decline" ? "Decline" : "Send back"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        )}
      </form>
    </motion.article>
  );
}

export function ReviewList({ moments, action }: { moments: Moment[]; action: ReviewFn }) {
  const [flash, setFlash] = useState<string | null>(null);
  return (
    <div>
      <div aria-live="polite">{flash ? <FormMessage tone="success">{flash}</FormMessage> : null}</div>
      <AnimatePresence initial={false}>
        {moments.map((m) => (
          <ReviewCard key={m.id} moment={m} action={action} onReviewed={setFlash} />
        ))}
      </AnimatePresence>
    </div>
  );
}
