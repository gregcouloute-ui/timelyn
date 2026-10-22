"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepository, requireViewer } from "@/lib/auth/session";
import { describeError } from "@/lib/services/errors";
import { acceptInvitation } from "@/lib/services/members";
import type { FormState } from "@/lib/validation";

export async function acceptInvitationAction(token: string): Promise<FormState> {
  const viewer = await requireViewer(`/invite/${token}`);
  let slug: string;
  try {
    slug = await acceptInvitation(await getRepository(), viewer, token);
  } catch (error) {
    return { status: "error", message: describeError(error), fieldErrors: {} };
  }
  revalidatePath("/stories");
  redirect(`/s/${slug}?notice=joined`);
}
