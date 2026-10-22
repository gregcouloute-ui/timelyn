"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, storyContext } from "@/lib/actions";
import { siteUrl } from "@/lib/config";
import { can } from "@/lib/domain/permissions";
import { describeError } from "@/lib/services/errors";
import { changeRole, invite, removeMember, withdrawInvitation } from "@/lib/services/members";
import { editMoment, removeMoment, reviewMoment, submitMoment } from "@/lib/services/moments";
import { deleteStory, removeChapter, saveChapter, setCover, updateStory } from "@/lib/services/stories";
import {
  chapterSchema,
  invitationSchema,
  memberRoleSchema,
  momentSchema,
  parseForm,
  reviewSchema,
  storySchema,
  type FormState,
} from "@/lib/validation";

const refresh = (slug: string) => revalidatePath(`/s/${slug}`, "layout");

function captionsFrom(formData: FormData): Record<string, string | null> {
  const captions: Record<string, string | null> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("caption:") || typeof value !== "string") continue;
    const id = key.slice("caption:".length);
    if (!z.uuid().safeParse(id).success) continue;
    const text = value.trim().slice(0, 300);
    captions[id] = text || null;
  }
  return captions;
}

/* ------------------------------------------------------------------ moments */

export async function saveMomentAction(
  slug: string,
  momentId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { viewer, repo, access } = await storyContext(slug);
  const parsed = parseForm(momentSchema, formData);
  if (!parsed.ok) return parsed.state;

  let destination: string;
  try {
    const captions = captionsFrom(formData);
    const moment = momentId
      ? await editMoment(repo, access, viewer, momentId, parsed.data, captions)
      : await submitMoment(repo, access, viewer, parsed.data, captions);
    const notice = moment.status === "published" ? (momentId ? "moment-saved" : "moment-added") : momentId ? "moment-resent" : "moment-sent";
    destination =
      moment.status === "published" ? `/s/${slug}/m/${moment.id}?notice=${notice}` : `/s/${slug}/mine?notice=${notice}`;
  } catch (error) {
    return failure(error, formData);
  }
  refresh(slug);
  redirect(destination);
}

export async function deleteMomentAction(slug: string, momentId: string): Promise<FormState> {
  const { viewer, repo, access } = await storyContext(slug);
  try {
    await removeMoment(repo, access, viewer, momentId);
  } catch (error) {
    return failure(error);
  }
  refresh(slug);
  redirect(can.review(access.role) ? `/s/${slug}?notice=moment-removed` : `/s/${slug}/mine?notice=moment-removed`);
}

export async function reviewAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, repo, access } = await storyContext(slug);
  const parsed = parseForm(reviewSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const milestone = formData.get("isMilestone") === "on";
    const moment = await reviewMoment(repo, access, viewer, parsed.data.momentId, parsed.data.decision, parsed.data.note, milestone);
    refresh(slug);
    const messages = {
      publish: `“${moment.title}” is now part of the story.`,
      request_changes: `“${moment.title}” has been sent back to ${moment.contributorName.split(" ")[0]} with your note.`,
      decline: `“${moment.title}” has been declined. ${moment.contributorName.split(" ")[0]} can still see it in their contributions.`,
    } as const;
    return { status: "success", message: messages[parsed.data.decision] };
  } catch (error) {
    return failure(error);
  }
}

/* -------------------------------------------------------------------- story */

export async function updateStoryAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { repo, access } = await storyContext(slug);
  const parsed = parseForm(storySchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    await updateStory(repo, access, parsed.data);
  } catch (error) {
    return failure(error, formData);
  }
  refresh(slug);
  return { status: "success", message: "Story details saved." };
}

export async function setCoverAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { repo, access } = await storyContext(slug);
  const raw = formData.get("coverMediaId");
  const id = raw === "none" ? null : z.uuid().safeParse(raw).data;
  if (id === undefined) return { status: "error", message: "Choose a photograph.", fieldErrors: {} };
  try {
    await setCover(repo, access, id);
  } catch (error) {
    return failure(error);
  }
  refresh(slug);
  return { status: "success", message: id ? "Cover photograph updated." : "Cover photograph removed." };
}

export async function deleteStoryAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { repo, access } = await storyContext(slug);
  try {
    await deleteStory(repo, access, String(formData.get("confirmation") ?? ""));
  } catch (error) {
    return { status: "error", message: describeError(error), fieldErrors: {} };
  }
  revalidatePath("/stories");
  redirect("/stories?notice=story-deleted");
}

export async function saveChapterAction(
  slug: string,
  chapterId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { repo, access } = await storyContext(slug);
  const parsed = parseForm(chapterSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    await saveChapter(repo, access, chapterId, parsed.data);
  } catch (error) {
    return failure(error, formData);
  }
  refresh(slug);
  return { status: "success", message: chapterId ? "Chapter saved." : `“${parsed.data.title}” added.` };
}

export async function deleteChapterAction(slug: string, chapterId: string): Promise<FormState> {
  const { repo, access } = await storyContext(slug);
  try {
    await removeChapter(repo, access, chapterId);
  } catch (error) {
    return failure(error);
  }
  refresh(slug);
  return { status: "success", message: "Chapter removed. Its moments now sit in the chapter before it." };
}

/* ------------------------------------------------------------------- people */

export type InviteState = FormState | { status: "invited"; email: string; link: string; expiresAt: string };

export async function inviteAction(slug: string, _prev: InviteState, formData: FormData): Promise<InviteState> {
  const { viewer, repo, access } = await storyContext(slug);
  const parsed = parseForm(invitationSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const { invitation, token } = await invite(repo, access, viewer, parsed.data);
    refresh(slug);
    return { status: "invited", email: invitation.email, link: `${siteUrl()}/invite/${token}`, expiresAt: invitation.expiresAt };
  } catch (error) {
    return failure(error, formData);
  }
}

export async function withdrawInvitationAction(slug: string, invitationId: string): Promise<FormState> {
  const { repo, access } = await storyContext(slug);
  try {
    await withdrawInvitation(repo, access, invitationId);
  } catch (error) {
    return failure(error);
  }
  refresh(slug);
  return { status: "success", message: "Invitation withdrawn. The link no longer works." };
}

export async function changeRoleAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, repo, access } = await storyContext(slug);
  const parsed = memberRoleSchema.safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!parsed.success) return { status: "error", message: "Choose a role.", fieldErrors: {} };
  try {
    await changeRole(repo, access, viewer, parsed.data.userId, parsed.data.role);
  } catch (error) {
    return failure(error);
  }
  refresh(slug);
  return { status: "success", message: "Role updated." };
}

export async function removeMemberAction(slug: string, userId: string): Promise<FormState> {
  const { viewer, repo, access } = await storyContext(slug);
  try {
    await removeMember(repo, access, viewer, userId);
  } catch (error) {
    return failure(error);
  }
  if (userId === viewer.id) {
    revalidatePath("/stories");
    redirect("/stories?notice=left");
  }
  refresh(slug);
  return { status: "success", message: "They no longer have access to this story." };
}
