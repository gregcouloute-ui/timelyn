"use server";

import { redirect } from "next/navigation";
import { failure } from "@/lib/actions";
import { getRepository, requireViewer } from "@/lib/auth/session";
import { createStory } from "@/lib/services/stories";
import { parseForm, storySchema, type FormState } from "@/lib/validation";

export async function createStoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer("/stories/new");
  const parsed = parseForm(storySchema, formData);
  if (!parsed.ok) return parsed.state;
  let slug: string;
  try {
    const story = await createStory(await getRepository(), viewer, parsed.data);
    slug = story.slug;
  } catch (error) {
    return failure(error, formData);
  }
  redirect(`/s/${slug}?notice=story-created`);
}
