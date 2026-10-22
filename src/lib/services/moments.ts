import { randomUUID } from "node:crypto";
import type { Repository } from "@/lib/data/repository";
import { compareDates } from "@/lib/domain/dates";
import { atLeast, can } from "@/lib/domain/permissions";
import type { Chapter, Moment, MomentStatus, ReviewDecision, Viewer } from "@/lib/domain/types";
import type { MomentInput } from "@/lib/validation";
import { ServiceError, forbidden, notFound } from "./errors";
import type { StoryAccess } from "./stories";

/* ---------------------------------------------------------------- reading */

export interface TimelineChapter {
  chapter: Chapter;
  endYear: number | null;
  moments: Moment[];
}

/** Places each moment in the chapter of life it belongs to, by date. */
export function arrangeTimeline(chapters: Chapter[], moments: Moment[]): TimelineChapter[] {
  const ordered = [...chapters].sort((a, b) => a.startYear - b.startYear);
  const sorted = [...moments].sort((a, b) => compareDates(a.date, b.date) || a.createdAt.localeCompare(b.createdAt));
  return ordered.map((chapter, i) => {
    const next = ordered[i + 1];
    const inChapter = sorted.filter((m) => {
      const afterStart = i === 0 || m.date.year >= chapter.startYear;
      const beforeNext = !next || m.date.year < next.startYear;
      return afterStart && beforeNext;
    });
    return { chapter, endYear: next ? next.startYear - 1 : null, moments: inChapter };
  });
}

export async function loadTimeline(repo: Repository, access: StoryAccess, viewer: Viewer) {
  const [chapters, published, mine, awaitingReview] = await Promise.all([
    repo.listChapters(access.story.id),
    repo.listMoments(access.story.id, { statuses: ["published"] }),
    atLeast(access.role, "contributor")
      ? repo.listMoments(access.story.id, { contributorId: viewer.id, statuses: ["pending", "changes_requested"] })
      : Promise.resolve([] as Moment[]),
    can.review(access.role) ? repo.countMoments(access.story.id, "pending") : Promise.resolve(0),
  ]);
  return { chapters: arrangeTimeline(chapters, published), published, mine, awaitingReview };
}

export async function loadMoment(repo: Repository, access: StoryAccess, viewer: Viewer, momentId: string) {
  const moment = await repo.getMoment(momentId);
  if (!moment || moment.storyId !== access.story.id || !can.seeMoment(access.role, viewer.id, moment)) {
    throw notFound("We couldn't find that moment.");
  }
  return moment;
}

/** The published moments either side of this one, for reading onwards. */
export async function neighbours(repo: Repository, access: StoryAccess, moment: Moment) {
  const all = await repo.listMoments(access.story.id, { statuses: ["published"] });
  const index = all.findIndex((m) => m.id === moment.id);
  if (index === -1) return { previous: null, next: null };
  return { previous: all[index - 1] ?? null, next: all[index + 1] ?? null };
}

export async function reviewQueue(repo: Repository, access: StoryAccess) {
  if (!can.review(access.role)) throw forbidden("Only the story keeper and editors can review contributions.");
  const [pending, returned] = await Promise.all([
    repo.listMoments(access.story.id, { statuses: ["pending"] }),
    repo.listMoments(access.story.id, { statuses: ["changes_requested"] }),
  ]);
  const byNewest = (a: Moment, b: Moment) => b.updatedAt.localeCompare(a.updatedAt);
  return { pending: pending.sort(byNewest), returned: returned.sort(byNewest) };
}

/* ---------------------------------------------------------------- writing */

async function checkMedia(
  repo: Repository,
  access: StoryAccess,
  viewer: Viewer,
  mediaIds: string[],
  momentId: string | null,
) {
  if (mediaIds.length === 0) return;
  const media = await repo.getMedia(mediaIds);
  if (media.length !== new Set(mediaIds).size) {
    throw new ServiceError("invalid", "One of the files is no longer available. Remove it and try again.");
  }
  for (const m of media) {
    const sameStory = m.storyId === access.story.id;
    const free = m.momentId === null || m.momentId === momentId;
    const allowed = m.uploadedBy === viewer.id || can.review(access.role);
    if (!sameStory || !free || !allowed) {
      throw new ServiceError("invalid", "One of the files can't be used here. Remove it and try again.");
    }
  }
}

/**
 * Moments may predate a birth (a parents' wedding, a family move), but not by
 * more than a lifetime; that is almost always a typing mistake.
 */
function checkDate(access: StoryAccess, input: MomentInput) {
  if (input.date.year < access.story.birthDate.year - 100) {
    throw new ServiceError("invalid", "That date is long before they were born. Check the year.");
  }
}

export async function submitMoment(
  repo: Repository,
  access: StoryAccess,
  viewer: Viewer,
  input: MomentInput,
  captions: Record<string, string | null>,
): Promise<Moment> {
  if (!can.contribute(access.role)) throw forbidden("Readers can't add moments. Ask the story keeper to make you a contributor.");
  checkDate(access, input);
  await checkMedia(repo, access, viewer, input.mediaIds, null);

  const isAdmin = can.review(access.role);
  const status: MomentStatus = isAdmin ? "published" : "pending";
  const moment = await repo.createMoment({
    id: randomUUID(),
    storyId: access.story.id,
    contributorId: viewer.id,
    status,
    title: input.title,
    body: input.body,
    date: input.date,
    place: input.place,
    people: input.people,
    isMilestone: isAdmin ? input.isMilestone : false,
  });
  await repo.attachMedia(moment.id, input.mediaIds, captions);
  return (await repo.getMoment(moment.id)) ?? moment;
}

export async function editMoment(
  repo: Repository,
  access: StoryAccess,
  viewer: Viewer,
  momentId: string,
  input: MomentInput,
  captions: Record<string, string | null>,
): Promise<Moment> {
  const existing = await loadMoment(repo, access, viewer, momentId);
  if (!can.editMoment(access.role, viewer.id, existing)) {
    throw forbidden(
      existing.status === "published"
        ? "This moment has been published. Ask the story keeper if something needs changing."
        : "You can only edit your own contributions.",
    );
  }
  checkDate(access, input);
  await checkMedia(repo, access, viewer, input.mediaIds, momentId);

  const isAdmin = can.review(access.role);
  await repo.detachMedia(momentId, input.mediaIds);
  await repo.updateMomentContent(
    momentId,
    {
      title: input.title,
      body: input.body,
      date: input.date,
      place: input.place,
      people: input.people,
      isMilestone: isAdmin ? input.isMilestone : existing.isMilestone,
    },
    !isAdmin,
  );
  await repo.attachMedia(momentId, input.mediaIds, captions);
  const updated = await repo.getMoment(momentId);
  if (!updated) throw notFound();
  return updated;
}

export async function reviewMoment(
  repo: Repository,
  access: StoryAccess,
  viewer: Viewer,
  momentId: string,
  decision: ReviewDecision,
  note: string | null,
  isMilestone?: boolean,
): Promise<Moment> {
  if (!can.review(access.role)) throw forbidden("Only the story keeper and editors can review contributions.");
  const moment = await loadMoment(repo, access, viewer, momentId);
  if (decision === "request_changes" && !note) {
    throw new ServiceError("invalid", "Say what you'd like changed, so they know what to do next.");
  }
  const status: MomentStatus =
    decision === "publish" ? "published" : decision === "request_changes" ? "changes_requested" : "declined";
  return repo.reviewMoment(moment.id, {
    status,
    reviewNote: decision === "publish" ? null : note,
    reviewedBy: viewer.id,
    isMilestone,
  });
}

export async function removeMoment(repo: Repository, access: StoryAccess, viewer: Viewer, momentId: string) {
  const moment = await loadMoment(repo, access, viewer, momentId);
  if (!can.deleteMoment(access.role, viewer.id, moment)) {
    throw forbidden("Published moments can only be removed by the story keeper or an editor.");
  }
  await repo.deleteMoment(moment.id);
}
