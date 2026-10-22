import { randomUUID } from "node:crypto";
import type { Repository } from "@/lib/data/repository";
import { RepositoryError } from "@/lib/data/repository";
import { can } from "@/lib/domain/permissions";
import type { Chapter, Role, Story, Viewer } from "@/lib/domain/types";
import type { ChapterInput, StoryInput } from "@/lib/validation";
import { ServiceError, forbidden, notFound } from "./errors";
import { storySlugBase } from "./slug";

export interface StoryAccess {
  story: Story;
  role: Role;
}

/**
 * Loads a story for the viewer. Stories the viewer doesn't belong to are
 * reported as not found, so their existence is never revealed.
 */
export async function accessStory(repo: Repository, viewer: Viewer, slug: string): Promise<StoryAccess> {
  const story = await repo.getStoryBySlug(slug);
  if (!story) throw notFound("We couldn't find that story.");
  const role = await repo.getRole(story.id, viewer.id);
  if (!role) throw notFound("We couldn't find that story.");
  return { story, role };
}

export async function accessStoryById(repo: Repository, viewer: Viewer, storyId: string): Promise<StoryAccess> {
  const story = await repo.getStoryById(storyId);
  if (!story) throw notFound("We couldn't find that story.");
  const role = await repo.getRole(story.id, viewer.id);
  if (!role) throw notFound("We couldn't find that story.");
  return { story, role };
}

export async function createStory(repo: Repository, viewer: Viewer, input: StoryInput): Promise<Story> {
  const base = storySlugBase(input.subjectName, input.knownAs);
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt === 1 ? 2 : randomUUID().slice(0, 4)}`;
    if (await repo.isSlugTaken(slug)) continue;
    try {
      return await repo.createStory({
        id: randomUUID(),
        slug,
        subjectName: input.subjectName,
        knownAs: input.knownAs,
        birthDate: input.birthDate,
        birthPlace: input.birthPlace,
        deathDate: input.deathDate,
        deathPlace: input.deathPlace,
        introduction: input.introduction,
        createdBy: viewer.id,
      });
    } catch (error) {
      if (error instanceof RepositoryError && error.code === "conflict") continue;
      throw error;
    }
  }
  throw new ServiceError("conflict", "We couldn't find a free web address for this story. Try adding a middle name.");
}

export async function updateStory(repo: Repository, access: StoryAccess, input: StoryInput): Promise<Story> {
  if (!can.editStory(access.role)) throw forbidden("Only the story keeper and editors can change these details.");
  return repo.updateStory(access.story.id, {
    subjectName: input.subjectName,
    knownAs: input.knownAs,
    birthDate: input.birthDate,
    birthPlace: input.birthPlace,
    deathDate: input.deathDate,
    deathPlace: input.deathPlace,
    introduction: input.introduction,
  });
}

export async function setCover(repo: Repository, access: StoryAccess, mediaId: string | null): Promise<void> {
  if (!can.editStory(access.role)) throw forbidden();
  if (mediaId) {
    const images = await repo.listStoryImages(access.story.id);
    if (!images.some((m) => m.id === mediaId)) {
      throw new ServiceError("invalid", "Choose a published photograph from this story.");
    }
  }
  await repo.updateStory(access.story.id, { coverMediaId: mediaId });
}

export async function deleteStory(repo: Repository, access: StoryAccess, confirmation: string): Promise<void> {
  if (!can.deleteStory(access.role)) throw forbidden("Only the story keeper can delete this story.");
  if (confirmation.trim().toLowerCase() !== access.story.subjectName.trim().toLowerCase()) {
    throw new ServiceError("invalid", `Type “${access.story.subjectName}” exactly to confirm.`);
  }
  await repo.deleteStory(access.story.id);
}

/* ------------------------------------------------------------- chapters */

export async function saveChapter(
  repo: Repository,
  access: StoryAccess,
  chapterId: string | null,
  input: ChapterInput,
): Promise<Chapter> {
  if (!can.manageChapters(access.role)) throw forbidden("Only the story keeper and editors can arrange chapters.");
  if (input.startYear < access.story.birthDate.year) {
    throw new ServiceError("invalid", `A chapter can't begin before ${access.story.birthDate.year}.`);
  }
  if (chapterId) {
    const existing = await repo.getChapter(chapterId);
    if (!existing || existing.storyId !== access.story.id) throw notFound("That chapter no longer exists.");
    return repo.updateChapter(chapterId, input);
  }
  return repo.createChapter(access.story.id, input);
}

export async function removeChapter(repo: Repository, access: StoryAccess, chapterId: string): Promise<void> {
  if (!can.manageChapters(access.role)) throw forbidden();
  const chapters = await repo.listChapters(access.story.id);
  const target = chapters.find((c) => c.id === chapterId);
  if (!target) throw notFound("That chapter no longer exists.");
  if (chapters.length === 1) throw new ServiceError("invalid", "A story needs at least one chapter.");
  await repo.deleteChapter(chapterId);
}
