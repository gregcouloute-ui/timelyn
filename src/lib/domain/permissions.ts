import type { Moment, Role } from "./types";

/**
 * TimeLyn's authorisation model.
 *
 *  owner        The designated administrator. Full control, including
 *               appointing editors and deleting the story.
 *  editor       A co-administrator. Reviews contributions, edits the story
 *               and invites contributors and viewers.
 *  contributor  Adds moments. Their contributions wait for review.
 *  viewer       Reads the published story.
 *
 * These rules are enforced in the application services and mirrored by
 * Row Level Security in the database (see supabase/migrations).
 */

const RANK: Record<Role, number> = { viewer: 0, contributor: 1, editor: 2, owner: 3 };

export function atLeast(role: Role | null | undefined, minimum: Role): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[minimum];
}

export const can = {
  viewStory: (role: Role | null) => atLeast(role, "viewer"),
  contribute: (role: Role | null) => atLeast(role, "contributor"),
  review: (role: Role | null) => atLeast(role, "editor"),
  editStory: (role: Role | null) => atLeast(role, "editor"),
  manageChapters: (role: Role | null) => atLeast(role, "editor"),
  inviteMembers: (role: Role | null) => atLeast(role, "editor"),
  deleteStory: (role: Role | null) => role === "owner",

  /** Which roles a member may hand out when inviting or changing roles. */
  assignableRoles(role: Role | null): Exclude<Role, "owner">[] {
    if (role === "owner") return ["editor", "contributor", "viewer"];
    if (role === "editor") return ["contributor", "viewer"];
    return [];
  },

  /** Whether `actor` may change or remove a member who currently holds `target`. */
  manageMember(actor: Role | null, target: Role): boolean {
    if (target === "owner") return false;
    if (actor === "owner") return true;
    if (actor === "editor") return target === "contributor" || target === "viewer";
    return false;
  },

  /** Whether a viewer may see a given moment. */
  seeMoment(role: Role | null, viewerId: string, moment: Pick<Moment, "status" | "contributorId">) {
    if (!atLeast(role, "viewer")) return false;
    if (moment.status === "published") return true;
    if (atLeast(role, "editor")) return true;
    return moment.contributorId === viewerId;
  },

  editMoment(role: Role | null, viewerId: string, moment: Pick<Moment, "status" | "contributorId">) {
    if (atLeast(role, "editor")) return true;
    if (!atLeast(role, "contributor")) return false;
    return (
      moment.contributorId === viewerId &&
      (moment.status === "pending" || moment.status === "changes_requested")
    );
  },

  deleteMoment(role: Role | null, viewerId: string, moment: Pick<Moment, "status" | "contributorId">) {
    if (atLeast(role, "editor")) return true;
    if (!atLeast(role, "contributor")) return false;
    return moment.contributorId === viewerId && moment.status !== "published";
  },
};

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Story keeper",
  editor: "Editor",
  contributor: "Contributor",
  viewer: "Reader",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  owner: "Looks after the story. Approves contributions and decides who can take part.",
  editor: "Helps look after the story. Approves contributions and invites family.",
  contributor: "Adds photographs, stories and recordings. Each one is reviewed before it appears.",
  viewer: "Reads the story as it grows.",
};
