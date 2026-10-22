/**
 * TimeLyn domain model.
 *
 * These types are the shared language between the data layer, application
 * services and the interface. They are deliberately independent of Supabase
 * so that the local demonstration store and the production database can
 * implement the same contract.
 */

export type Role = "owner" | "editor" | "contributor" | "viewer";

export const ROLES: readonly Role[] = ["owner", "editor", "contributor", "viewer"] as const;

/**
 * A date as families actually remember it: sometimes exact, sometimes only a
 * year, sometimes "around 1962".
 */
export interface PartialDate {
  year: number;
  month: number | null;
  day: number | null;
  circa: boolean;
}

export interface Viewer {
  id: string;
  displayName: string;
  email: string | null;
}

export interface Story {
  id: string;
  slug: string;
  /** Full name of the person whose life this is. */
  subjectName: string;
  /** What family and friends call them, e.g. "Peggy". */
  knownAs: string | null;
  birthDate: PartialDate;
  birthPlace: string | null;
  /** Present only when the person has died. */
  deathDate: PartialDate | null;
  deathPlace: string | null;
  /** A short introduction shown at the top of the story. */
  introduction: string | null;
  coverMediaId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorySummary extends Story {
  role: Role;
  coverUrl: string | null;
  publishedCount: number;
  awaitingReviewCount: number;
  memberCount: number;
}

export interface Chapter {
  id: string;
  storyId: string;
  title: string;
  /** The year this chapter of life begins. Moments are placed by date. */
  startYear: number;
  summary: string | null;
}

export type MomentStatus = "pending" | "changes_requested" | "published" | "declined";

export type MediaKind = "image" | "video" | "audio";

export interface Media {
  id: string;
  storyId: string;
  momentId: string | null;
  kind: MediaKind;
  path: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  caption: string | null;
  uploadedBy: string;
  createdAt: string;
  /** Resolved, time-limited URL for display. */
  url: string | null;
}

export interface Moment {
  id: string;
  storyId: string;
  title: string;
  body: string | null;
  date: PartialDate;
  place: string | null;
  /** People who appear in or are part of this moment, as written by family. */
  people: string[];
  isMilestone: boolean;
  status: MomentStatus;
  contributorId: string;
  contributorName: string;
  /** How the contributor relates to the subject, e.g. "Daughter". */
  contributorRelationship: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  media: Media[];
}

export interface Member {
  storyId: string;
  userId: string;
  displayName: string;
  email: string | null;
  role: Role;
  relationship: string | null;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  storyId: string;
  email: string;
  role: Exclude<Role, "owner">;
  relationship: string | null;
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
}

export type InvitationState = "open" | "accepted" | "revoked" | "expired";

export type ReviewDecision = "publish" | "request_changes" | "decline";
