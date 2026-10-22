import type {
  Chapter,
  Invitation,
  Media,
  MediaKind,
  Member,
  Moment,
  MomentStatus,
  PartialDate,
  Role,
  Story,
  StorySummary,
} from "@/lib/domain/types";

/**
 * The persistence contract. Two implementations exist:
 *
 *  - SupabaseRepository: production. Runs as the signed-in user, so Postgres
 *    Row Level Security applies to every query.
 *  - DemoRepository: an in-memory store for the local demonstration mode.
 *
 * Application services (src/lib/services) check permissions before calling
 * the repository, so both implementations share the same rules.
 */

export interface NewStoryRecord {
  id: string;
  slug: string;
  subjectName: string;
  knownAs: string | null;
  birthDate: PartialDate;
  birthPlace: string | null;
  deathDate: PartialDate | null;
  deathPlace: string | null;
  introduction: string | null;
  createdBy: string;
}

export type StoryPatch = Partial<Omit<NewStoryRecord, "id" | "slug" | "createdBy">> & {
  coverMediaId?: string | null;
};

export interface MomentRecord {
  title: string;
  body: string | null;
  date: PartialDate;
  place: string | null;
  people: string[];
  isMilestone: boolean;
}

export interface NewMomentRecord extends MomentRecord {
  id: string;
  storyId: string;
  status: MomentStatus;
  contributorId: string;
}

export interface MomentReviewPatch {
  status: MomentStatus;
  reviewNote: string | null;
  reviewedBy: string;
  isMilestone?: boolean;
}

export interface NewMediaRecord {
  id: string;
  storyId: string;
  kind: MediaKind;
  path: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  uploadedBy: string;
}

export interface NewInvitationRecord {
  storyId: string;
  email: string;
  role: Exclude<Role, "owner">;
  relationship: string | null;
  tokenHash: string;
  invitedBy: string;
  expiresAt: string;
}

export interface InvitationPreview {
  subjectName: string;
  knownAs: string | null;
  invitedByName: string | null;
  role: Exclude<Role, "owner">;
  email: string;
  state: "open" | "accepted" | "revoked" | "expired";
}

export interface UploadTarget {
  /** How the browser should send the bytes. */
  strategy: "supabase-signed" | "demo";
  path: string;
  token?: string;
  uploadUrl?: string;
}

export interface Repository {
  // Stories
  listStoriesForUser(userId: string): Promise<StorySummary[]>;
  getStoryBySlug(slug: string): Promise<Story | null>;
  getStoryById(id: string): Promise<Story | null>;
  isSlugTaken(slug: string): Promise<boolean>;
  getRole(storyId: string, userId: string): Promise<Role | null>;
  createStory(record: NewStoryRecord): Promise<Story>;
  updateStory(id: string, patch: StoryPatch): Promise<Story>;
  deleteStory(id: string): Promise<void>;

  // Chapters
  listChapters(storyId: string): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | null>;
  createChapter(storyId: string, input: Omit<Chapter, "id" | "storyId">): Promise<Chapter>;
  updateChapter(id: string, input: Omit<Chapter, "id" | "storyId">): Promise<Chapter>;
  deleteChapter(id: string): Promise<void>;

  // Moments (media resolved with display URLs)
  listMoments(storyId: string, filter?: { statuses?: MomentStatus[]; contributorId?: string }): Promise<Moment[]>;
  getMoment(id: string): Promise<Moment | null>;
  countMoments(storyId: string, status: MomentStatus): Promise<number>;
  createMoment(record: NewMomentRecord): Promise<Moment>;
  updateMomentContent(id: string, record: MomentRecord, resubmit: boolean): Promise<Moment>;
  reviewMoment(id: string, patch: MomentReviewPatch): Promise<Moment>;
  deleteMoment(id: string): Promise<void>;

  // Media
  createUploadTarget(storyId: string, mediaId: string, path: string): Promise<UploadTarget>;
  confirmUpload(path: string): Promise<boolean>;
  createMedia(record: NewMediaRecord): Promise<Media>;
  getMedia(ids: string[]): Promise<Media[]>;
  listStoryImages(storyId: string): Promise<Media[]>;
  attachMedia(momentId: string, mediaIds: string[], captions: Record<string, string | null>): Promise<void>;
  detachMedia(momentId: string, keepIds: string[]): Promise<string[]>;
  removeMediaObjects(paths: string[]): Promise<void>;

  // Members
  listMembers(storyId: string): Promise<Member[]>;
  updateMemberRole(storyId: string, userId: string, role: Exclude<Role, "owner">): Promise<void>;
  removeMember(storyId: string, userId: string): Promise<void>;

  // Invitations
  listInvitations(storyId: string): Promise<Invitation[]>;
  createInvitation(record: NewInvitationRecord): Promise<Invitation>;
  revokeInvitation(id: string): Promise<void>;
  previewInvitation(token: string): Promise<InvitationPreview | null>;
  acceptInvitation(token: string, user: { id: string; email: string | null }): Promise<string>;
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "forbidden" | "conflict" | "invalid" | "unavailable" = "unavailable",
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}
