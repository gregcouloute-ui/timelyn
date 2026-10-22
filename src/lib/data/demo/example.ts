import { compareDates } from "@/lib/domain/dates";
import type { Chapter, Media, Moment, Story } from "@/lib/domain/types";
import { buildSeed, STORIES } from "./seed";

/**
 * The fictional Ellison family, read straight from the seed so the public
 * example is always pristine, whatever demo visitors have changed.
 */
export function exampleStory(which: "margaret" | "walter" = "margaret") {
  const seed = buildSeed();
  const storyId = STORIES[which];
  const story = seed.stories.find((s) => s.id === storyId) as Story;
  const users = new Map(seed.users.map((u) => [u.id, u.displayName]));
  const relationships = new Map(seed.members.filter((m) => m.storyId === storyId).map((m) => [m.userId, m.relationship]));

  const toMedia = (m: (typeof seed.media)[number]): Media => ({
    id: m.id,
    storyId: m.storyId,
    momentId: m.momentId,
    kind: m.kind,
    path: m.path,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    width: m.width,
    height: m.height,
    durationSeconds: m.durationSeconds,
    caption: m.caption,
    uploadedBy: m.uploadedBy,
    createdAt: m.createdAt,
    url: `/${m.path}`,
  });

  const moments: Moment[] = seed.moments
    .filter((m) => m.storyId === storyId && m.status === "published")
    .sort((a, b) => compareDates(a.date, b.date))
    .map((m) => ({
      ...m,
      contributorName: users.get(m.contributorId) ?? "A family member",
      contributorRelationship: relationships.get(m.contributorId) ?? null,
      media: seed.media.filter((x) => x.momentId === m.id).sort((a, b) => a.position - b.position).map(toMedia),
    }));

  const chapters: Chapter[] = seed.chapters.filter((c) => c.storyId === storyId);
  const cover = seed.media.find((m) => m.id === story.coverMediaId);
  return { story, moments, chapters, coverUrl: cover ? `/${cover.path}` : null };
}
