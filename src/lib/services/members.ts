import { createHash, randomBytes } from "node:crypto";
import type { Repository } from "@/lib/data/repository";
import { RepositoryError } from "@/lib/data/repository";
import { can } from "@/lib/domain/permissions";
import type { Invitation, InvitationState, Role, Viewer } from "@/lib/domain/types";
import type { InvitationInput } from "@/lib/validation";
import { ServiceError, forbidden, notFound } from "./errors";
import type { StoryAccess } from "./stories";

const INVITATION_DAYS = 14;

export const hashToken = (token: string) => createHash("sha256").update(token, "utf8").digest("hex");

export function invitationState(i: Pick<Invitation, "acceptedAt" | "revokedAt" | "expiresAt">, now = new Date()): InvitationState {
  if (i.acceptedAt) return "accepted";
  if (i.revokedAt) return "revoked";
  if (new Date(i.expiresAt) < now) return "expired";
  return "open";
}

export async function loadPeople(repo: Repository, access: StoryAccess) {
  const members = await repo.listMembers(access.story.id);
  const invitations = can.inviteMembers(access.role) ? await repo.listInvitations(access.story.id) : [];
  return { members, invitations };
}

/**
 * Creates an invitation and returns the one-time link token. Only a hash of
 * the token is stored, so a leaked database can't be used to join stories.
 */
export async function invite(
  repo: Repository,
  access: StoryAccess,
  viewer: Viewer,
  input: InvitationInput,
): Promise<{ invitation: Invitation; token: string }> {
  if (!can.inviteMembers(access.role)) throw forbidden("Only the story keeper and editors can invite people.");
  if (!can.assignableRoles(access.role).includes(input.role)) {
    throw forbidden("Only the story keeper can invite editors.");
  }
  const [members, invitations] = await Promise.all([repo.listMembers(access.story.id), repo.listInvitations(access.story.id)]);
  if (viewer.email && input.email === viewer.email.toLowerCase()) {
    throw new ServiceError("invalid", "That's your own email address.");
  }
  if (members.some((m) => m.email && m.email.toLowerCase() === input.email)) {
    throw new ServiceError("conflict", "That person is already part of this story.");
  }
  if (invitations.some((i) => i.email === input.email && invitationState(i) === "open")) {
    throw new ServiceError("conflict", "There's already an open invitation for that address. Withdraw it first to send a new one.");
  }
  const token = randomBytes(32).toString("base64url");
  const invitation = await repo.createInvitation({
    storyId: access.story.id,
    email: input.email,
    role: input.role,
    relationship: input.relationship,
    tokenHash: hashToken(token),
    invitedBy: viewer.id,
    expiresAt: new Date(Date.now() + INVITATION_DAYS * 864e5).toISOString(),
  });
  return { invitation, token };
}

export async function withdrawInvitation(repo: Repository, access: StoryAccess, invitationId: string) {
  if (!can.inviteMembers(access.role)) throw forbidden();
  const invitations = await repo.listInvitations(access.story.id);
  const target = invitations.find((i) => i.id === invitationId);
  if (!target) throw notFound("That invitation no longer exists.");
  if (!can.assignableRoles(access.role).includes(target.role)) throw forbidden("Only the story keeper can withdraw this invitation.");
  await repo.revokeInvitation(invitationId);
}

export async function changeRole(
  repo: Repository,
  access: StoryAccess,
  viewer: Viewer,
  userId: string,
  role: Exclude<Role, "owner">,
) {
  if (userId === viewer.id) throw new ServiceError("invalid", "You can't change your own role.");
  const target = (await repo.listMembers(access.story.id)).find((m) => m.userId === userId);
  if (!target) throw notFound("That person is no longer part of this story.");
  if (!can.manageMember(access.role, target.role) || !can.assignableRoles(access.role).includes(role)) {
    throw forbidden("You can't give or change that role.");
  }
  await repo.updateMemberRole(access.story.id, userId, role);
}

export async function removeMember(repo: Repository, access: StoryAccess, viewer: Viewer, userId: string) {
  const target = (await repo.listMembers(access.story.id)).find((m) => m.userId === userId);
  if (!target) throw notFound("That person is no longer part of this story.");
  const leaving = userId === viewer.id;
  if (target.role === "owner") {
    throw forbidden(leaving ? "The story keeper can't leave their own story." : "The story keeper can't be removed.");
  }
  if (!leaving && !can.manageMember(access.role, target.role)) throw forbidden("You can't remove this person.");
  await repo.removeMember(access.story.id, userId);
}

export async function acceptInvitation(repo: Repository, viewer: Viewer, token: string): Promise<string> {
  try {
    return await repo.acceptInvitation(token, { id: viewer.id, email: viewer.email });
  } catch (error) {
    if (error instanceof RepositoryError) {
      throw new ServiceError(error.code === "unavailable" ? "unavailable" : error.code, error.message);
    }
    throw error;
  }
}
