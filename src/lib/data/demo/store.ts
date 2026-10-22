import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { compareDates } from "@/lib/domain/dates";
import type {
  Chapter,
  Invitation,
  Media,
  Member,
  Moment,
  MomentStatus,
  Role,
  Story,
  StorySummary,
} from "@/lib/domain/types";
import {
  RepositoryError,
  type InvitationPreview,
  type MomentRecord,
  type MomentReviewPatch,
  type NewInvitationRecord,
  type NewMediaRecord,
  type NewMomentRecord,
  type NewStoryRecord,
  type Repository,
  type StoryPatch,
  type UploadTarget,
} from "../repository";
import { buildSeed, type DemoMediaRow, type DemoMember, type DemoMomentRow, type DemoUser } from "./seed";

interface DemoInvitationRow extends Omit<Invitation, "invitedByName"> {
  tokenHash: string;
  acceptedBy: string | null;
}

interface DemoState {
  users: DemoUser[];
  stories: Story[];
  members: DemoMember[];
  chapters: Chapter[];
  moments: DemoMomentRow[];
  media: DemoMediaRow[];
  invitations: DemoInvitationRow[];
  blobs: Map<string, { bytes: Uint8Array; mimeType: string }>;
  pendingUploads: Set<string>;
  startedAt: string;
}

function freshState(): DemoState {
  const seed = buildSeed();
  return {
    ...seed,
    invitations: [],
    blobs: new Map(),
    pendingUploads: new Set(),
    startedAt: new Date().toISOString(),
  };
}

// Survive hot reloads in development; one store per server process.
const globalStore = globalThis as unknown as { __everlineDemo?: DemoState };
export function demoState(): DemoState {
  if (!globalStore.__everlineDemo) globalStore.__everlineDemo = freshState();
  return globalStore.__everlineDemo;
}

export function resetDemoState() {
  globalStore.__everlineDemo = freshState();
}

const sha256 = (t: string) => createHash("sha256").update(t, "utf8").digest("hex");
const nowIso = () => new Date().toISOString();
const clone = <T>(v: T): T => structuredClone(v);

function mediaUrl(row: DemoMediaRow): string {
  return row.path.startsWith("demo/") ? `/${row.path}` : `/api/demo/media/${row.id}`;
}

function toMedia(row: DemoMediaRow): Media {
  return {
    id: row.id,
    storyId: row.storyId,
    momentId: row.momentId,
    kind: row.kind,
    path: row.path,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    width: row.width,
    height: row.height,
    durationSeconds: row.durationSeconds,
    caption: row.caption,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
    url: mediaUrl(row),
  };
}

export class DemoRepository implements Repository {
  private get s() {
    return demoState();
  }

  /* ------------------------------------------------------------ users */

  listUsers(): DemoUser[] {
    return clone(this.s.users);
  }

  findUser(id: string): DemoUser | null {
    return this.s.users.find((u) => u.id === id) ?? null;
  }

  findUserByEmail(email: string): DemoUser | null {
    return this.s.users.find((u) => u.email === email.toLowerCase()) ?? null;
  }

  createUser(displayName: string, email: string): DemoUser {
    const user: DemoUser = { id: randomUUID(), displayName, email: email.toLowerCase() };
    this.s.users.push(user);
    return clone(user);
  }

  /* ---------------------------------------------------------- stories */

  async listStoriesForUser(userId: string): Promise<StorySummary[]> {
    const mine = this.s.members.filter((m) => m.userId === userId);
    return mine
      .map((m) => {
        const story = this.s.stories.find((s) => s.id === m.storyId)!;
        const cover = story.coverMediaId ? this.s.media.find((x) => x.id === story.coverMediaId) : undefined;
        const moments = this.s.moments.filter((x) => x.storyId === story.id);
        return {
          ...clone(story),
          role: m.role,
          coverUrl: cover ? mediaUrl(cover) : null,
          publishedCount: moments.filter((x) => x.status === "published").length,
          awaitingReviewCount: moments.filter((x) => x.status === "pending").length,
          memberCount: this.s.members.filter((x) => x.storyId === story.id).length,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getStoryBySlug(slug: string) {
    return clone(this.s.stories.find((s) => s.slug === slug) ?? null);
  }

  async getStoryById(id: string) {
    return clone(this.s.stories.find((s) => s.id === id) ?? null);
  }

  async isSlugTaken(slug: string) {
    return this.s.stories.some((s) => s.slug === slug);
  }

  async getRole(storyId: string, userId: string): Promise<Role | null> {
    return this.s.members.find((m) => m.storyId === storyId && m.userId === userId)?.role ?? null;
  }

  async createStory(record: NewStoryRecord): Promise<Story> {
    const ts = nowIso();
    const story: Story = { ...record, coverMediaId: null, createdAt: ts, updatedAt: ts };
    this.s.stories.push(story);
    this.s.members.push({ storyId: story.id, userId: record.createdBy, role: "owner", relationship: null, joinedAt: ts });
    this.s.chapters.push({ id: randomUUID(), storyId: story.id, title: "Early years", startYear: record.birthDate.year, summary: null });
    return clone(story);
  }

  async updateStory(id: string, patch: StoryPatch): Promise<Story> {
    const story = this.s.stories.find((s) => s.id === id);
    if (!story) throw new RepositoryError("Story not found", "not_found");
    if (patch.coverMediaId) {
      const cover = this.s.media.find((m) => m.id === patch.coverMediaId);
      if (!cover || cover.storyId !== id || cover.kind !== "image") {
        throw new RepositoryError("The cover must be an image from this story", "invalid");
      }
    }
    Object.assign(story, patch, { updatedAt: nowIso() });
    return clone(story);
  }

  async deleteStory(id: string) {
    const s = this.s;
    for (const m of s.media.filter((x) => x.storyId === id)) s.blobs.delete(m.path);
    s.stories = s.stories.filter((x) => x.id !== id);
    s.members = s.members.filter((x) => x.storyId !== id);
    s.chapters = s.chapters.filter((x) => x.storyId !== id);
    s.moments = s.moments.filter((x) => x.storyId !== id);
    s.media = s.media.filter((x) => x.storyId !== id);
    s.invitations = s.invitations.filter((x) => x.storyId !== id);
  }

  private touch(storyId: string) {
    const story = this.s.stories.find((s) => s.id === storyId);
    if (story) story.updatedAt = nowIso();
  }

  /* --------------------------------------------------------- chapters */

  async listChapters(storyId: string) {
    return clone(this.s.chapters.filter((c) => c.storyId === storyId).sort((a, b) => a.startYear - b.startYear));
  }

  async getChapter(id: string) {
    return clone(this.s.chapters.find((c) => c.id === id) ?? null);
  }

  private assertChapterYearFree(storyId: string, startYear: number, exceptId?: string) {
    if (this.s.chapters.some((c) => c.storyId === storyId && c.startYear === startYear && c.id !== exceptId)) {
      throw new RepositoryError("Another chapter already begins in that year.", "conflict");
    }
  }

  async createChapter(storyId: string, input: Omit<Chapter, "id" | "storyId">) {
    this.assertChapterYearFree(storyId, input.startYear);
    const chapter: Chapter = { id: randomUUID(), storyId, ...input };
    this.s.chapters.push(chapter);
    this.touch(storyId);
    return clone(chapter);
  }

  async updateChapter(id: string, input: Omit<Chapter, "id" | "storyId">) {
    const chapter = this.s.chapters.find((c) => c.id === id);
    if (!chapter) throw new RepositoryError("Chapter not found", "not_found");
    this.assertChapterYearFree(chapter.storyId, input.startYear, id);
    Object.assign(chapter, input);
    this.touch(chapter.storyId);
    return clone(chapter);
  }

  async deleteChapter(id: string) {
    this.s.chapters = this.s.chapters.filter((c) => c.id !== id);
  }

  /* ---------------------------------------------------------- moments */

  private hydrate(row: DemoMomentRow): Moment {
    const user = this.findUser(row.contributorId);
    const member = this.s.members.find((m) => m.storyId === row.storyId && m.userId === row.contributorId);
    return {
      ...clone(row),
      contributorName: user?.displayName ?? "A former member",
      contributorRelationship: member?.relationship ?? null,
      media: this.s.media
        .filter((m) => m.momentId === row.id)
        .sort((a, b) => a.position - b.position)
        .map(toMedia),
    };
  }

  async listMoments(storyId: string, filter: { statuses?: MomentStatus[]; contributorId?: string } = {}) {
    return this.s.moments
      .filter(
        (m) =>
          m.storyId === storyId &&
          (!filter.statuses || filter.statuses.includes(m.status)) &&
          (!filter.contributorId || m.contributorId === filter.contributorId),
      )
      .sort((a, b) => compareDates(a.date, b.date) || a.createdAt.localeCompare(b.createdAt))
      .map((m) => this.hydrate(m));
  }

  async getMoment(id: string) {
    const row = this.s.moments.find((m) => m.id === id);
    return row ? this.hydrate(row) : null;
  }

  async countMoments(storyId: string, status: MomentStatus) {
    return this.s.moments.filter((m) => m.storyId === storyId && m.status === status).length;
  }

  async createMoment(record: NewMomentRecord) {
    const ts = nowIso();
    const row: DemoMomentRow = {
      ...record,
      reviewNote: null,
      reviewedBy: record.status === "published" ? record.contributorId : null,
      reviewedAt: record.status === "published" ? ts : null,
      publishedAt: record.status === "published" ? ts : null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.s.moments.push(row);
    this.touch(record.storyId);
    return this.hydrate(row);
  }

  async updateMomentContent(id: string, record: MomentRecord, resubmit: boolean) {
    const row = this.s.moments.find((m) => m.id === id);
    if (!row) throw new RepositoryError("Moment not found", "not_found");
    Object.assign(row, record, { updatedAt: nowIso() });
    if (resubmit) row.status = "pending";
    this.touch(row.storyId);
    return this.hydrate(row);
  }

  async reviewMoment(id: string, patch: MomentReviewPatch) {
    const row = this.s.moments.find((m) => m.id === id);
    if (!row) throw new RepositoryError("Moment not found", "not_found");
    const ts = nowIso();
    row.status = patch.status;
    row.reviewNote = patch.reviewNote;
    row.reviewedBy = patch.reviewedBy;
    row.reviewedAt = ts;
    if (patch.isMilestone !== undefined) row.isMilestone = patch.isMilestone;
    if (patch.status === "published") row.publishedAt = row.publishedAt ?? ts;
    row.updatedAt = ts;
    this.touch(row.storyId);
    return this.hydrate(row);
  }

  async deleteMoment(id: string) {
    const s = this.s;
    for (const m of s.media.filter((x) => x.momentId === id)) s.blobs.delete(m.path);
    s.media = s.media.filter((x) => x.momentId !== id);
    s.moments = s.moments.filter((x) => x.id !== id);
  }

  /* ------------------------------------------------------------ media */

  async createUploadTarget(_storyId: string, mediaId: string, path: string): Promise<UploadTarget> {
    this.s.pendingUploads.add(path);
    return { strategy: "demo", path, uploadUrl: `/api/demo/uploads/${mediaId}?path=${encodeURIComponent(path)}` };
  }

  /** Called by the demo upload route once bytes arrive. */
  storeUpload(path: string, bytes: Uint8Array, mimeType: string): boolean {
    if (!this.s.pendingUploads.has(path)) return false;
    this.s.blobs.set(path, { bytes, mimeType });
    this.s.pendingUploads.delete(path);
    return true;
  }

  readBlob(path: string) {
    return this.s.blobs.get(path) ?? null;
  }

  async confirmUpload(path: string) {
    return this.s.blobs.has(path);
  }

  async createMedia(record: NewMediaRecord) {
    const row: DemoMediaRow = {
      ...record,
      momentId: null,
      purpose: "moment",
      caption: null,
      position: 0,
      createdAt: nowIso(),
    };
    this.s.media.push(row);
    return toMedia(row);
  }

  async getMedia(ids: string[]) {
    return this.s.media.filter((m) => ids.includes(m.id)).map(toMedia);
  }

  getMediaRow(id: string) {
    return this.s.media.find((m) => m.id === id) ?? null;
  }

  async listStoryImages(storyId: string) {
    const published = new Set(this.s.moments.filter((m) => m.storyId === storyId && m.status === "published").map((m) => m.id));
    return this.s.media
      .filter((m) => m.storyId === storyId && m.kind === "image" && (m.purpose === "cover" || (m.momentId && published.has(m.momentId))))
      .map(toMedia);
  }

  async attachMedia(momentId: string, mediaIds: string[], captions: Record<string, string | null>) {
    mediaIds.forEach((id, index) => {
      const row = this.s.media.find((m) => m.id === id);
      if (!row) return;
      row.momentId = momentId;
      row.position = index;
      if (id in captions) row.caption = captions[id] ?? null;
    });
  }

  async detachMedia(momentId: string, keepIds: string[]) {
    const removed = this.s.media.filter((m) => m.momentId === momentId && !keepIds.includes(m.id));
    for (const m of removed) this.s.blobs.delete(m.path);
    this.s.media = this.s.media.filter((m) => !removed.includes(m));
    return removed.map((m) => m.path);
  }

  async removeMediaObjects(paths: string[]) {
    for (const p of paths) this.s.blobs.delete(p);
  }

  /* ---------------------------------------------------------- members */

  async listMembers(storyId: string): Promise<Member[]> {
    const order: Record<Role, number> = { owner: 0, editor: 1, contributor: 2, viewer: 3 };
    return this.s.members
      .filter((m) => m.storyId === storyId)
      .map((m) => {
        const u = this.findUser(m.userId);
        return { ...m, displayName: u?.displayName ?? "Unknown", email: u?.email ?? null };
      })
      .sort((a, b) => order[a.role] - order[b.role] || a.displayName.localeCompare(b.displayName));
  }

  async updateMemberRole(storyId: string, userId: string, role: Exclude<Role, "owner">) {
    const m = this.s.members.find((x) => x.storyId === storyId && x.userId === userId);
    if (!m || m.role === "owner") throw new RepositoryError("Member not found", "not_found");
    m.role = role;
  }

  async removeMember(storyId: string, userId: string) {
    this.s.members = this.s.members.filter((x) => !(x.storyId === storyId && x.userId === userId && x.role !== "owner"));
  }

  /* ------------------------------------------------------ invitations */

  private toInvitation(row: DemoInvitationRow): Invitation {
    const { tokenHash: _t, acceptedBy: _a, ...rest } = row;
    void _t;
    void _a;
    return { ...clone(rest), invitedByName: this.findUser(row.invitedBy)?.displayName ?? "A family member" };
  }

  async listInvitations(storyId: string) {
    return this.s.invitations
      .filter((i) => i.storyId === storyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((i) => this.toInvitation(i));
  }

  async createInvitation(record: NewInvitationRecord) {
    const row: DemoInvitationRow = {
      id: randomUUID(),
      ...record,
      createdAt: nowIso(),
      acceptedAt: null,
      acceptedBy: null,
      revokedAt: null,
    };
    this.s.invitations.push(row);
    return this.toInvitation(row);
  }

  async revokeInvitation(id: string) {
    const row = this.s.invitations.find((i) => i.id === id);
    if (row && !row.acceptedAt) row.revokedAt = nowIso();
  }

  private stateOf(row: DemoInvitationRow): InvitationPreview["state"] {
    if (row.acceptedAt) return "accepted";
    if (row.revokedAt) return "revoked";
    if (row.expiresAt < nowIso()) return "expired";
    return "open";
  }

  async previewInvitation(token: string): Promise<InvitationPreview | null> {
    const row = this.s.invitations.find((i) => i.tokenHash === sha256(token));
    if (!row) return null;
    const story = this.s.stories.find((s) => s.id === row.storyId);
    if (!story) return null;
    return {
      subjectName: story.subjectName,
      knownAs: story.knownAs,
      invitedByName: this.findUser(row.invitedBy)?.displayName ?? null,
      role: row.role,
      email: row.email,
      state: this.stateOf(row),
    };
  }

  async acceptInvitation(token: string, user: { id: string; email: string | null }) {
    const row = this.s.invitations.find((i) => i.tokenHash === sha256(token));
    if (!row) throw new RepositoryError("This invitation link is not valid.", "not_found");
    const story = this.s.stories.find((s) => s.id === row.storyId);
    if (!story) throw new RepositoryError("This story no longer exists.", "not_found");
    const state = this.stateOf(row);
    if (state === "accepted") {
      if (row.acceptedBy === user.id) return story.slug;
      throw new RepositoryError("This invitation has already been used.", "conflict");
    }
    if (state === "revoked") throw new RepositoryError("This invitation has been withdrawn.", "conflict");
    if (state === "expired") throw new RepositoryError("This invitation has expired.", "conflict");
    if ((user.email ?? "").toLowerCase() !== row.email) {
      throw new RepositoryError("This invitation was sent to a different email address.", "forbidden");
    }
    const rank: Record<Role, number> = { viewer: 0, contributor: 1, editor: 2, owner: 3 };
    const existing = this.s.members.find((m) => m.storyId === row.storyId && m.userId === user.id);
    if (!existing) {
      this.s.members.push({ storyId: row.storyId, userId: user.id, role: row.role, relationship: row.relationship, joinedAt: nowIso() });
    } else if (rank[row.role] > rank[existing.role]) {
      existing.role = row.role;
    }
    row.acceptedAt = nowIso();
    row.acceptedBy = user.id;
    return story.slug;
  }
}

export const demoRepository = new DemoRepository();
