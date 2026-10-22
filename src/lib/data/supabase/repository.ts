import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "@/lib/config";
import type {
  Chapter,
  Invitation,
  Media,
  Member,
  Moment,
  MomentStatus,
  PartialDate,
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

/* ------------------------------------------------------------ row shapes */

interface StoryRow {
  id: string;
  slug: string;
  subject_name: string;
  known_as: string | null;
  birth_year: number;
  birth_month: number | null;
  birth_day: number | null;
  birth_circa: boolean;
  birth_place: string | null;
  death_year: number | null;
  death_month: number | null;
  death_day: number | null;
  death_place: string | null;
  introduction: string | null;
  cover_media_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ChapterRow {
  id: string;
  story_id: string;
  title: string;
  start_year: number;
  summary: string | null;
}

interface MediaRow {
  id: string;
  story_id: string;
  moment_id: string | null;
  kind: "image" | "video" | "audio";
  path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | string | null;
  caption: string | null;
  position: number;
  uploaded_by: string | null;
  created_at: string;
}

interface MomentRow {
  id: string;
  story_id: string;
  title: string;
  body: string | null;
  date_year: number;
  date_month: number | null;
  date_day: number | null;
  date_circa: boolean;
  place: string | null;
  people: string[] | null;
  is_milestone: boolean;
  status: MomentStatus;
  contributor_id: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  contributor: { display_name: string } | null;
  media: MediaRow[] | null;
}

interface InvitationRow {
  id: string;
  story_id: string;
  email: string;
  role: Exclude<Role, "owner">;
  relationship: string | null;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  inviter: { display_name: string } | null;
}

const MOMENT_SELECT =
  "*, contributor:profiles!moments_contributor_id_fkey(display_name), media!media_moment_id_fkey(*)";

const SIGNED_URL_SECONDS = 60 * 60;

/* -------------------------------------------------------------- mappers */

function partial(year: number, month: number | null, day: number | null, circa: boolean): PartialDate {
  return { year, month, day, circa };
}

function toStory(r: StoryRow): Story {
  return {
    id: r.id,
    slug: r.slug,
    subjectName: r.subject_name,
    knownAs: r.known_as,
    birthDate: partial(r.birth_year, r.birth_month, r.birth_day, r.birth_circa),
    birthPlace: r.birth_place,
    deathDate: r.death_year ? partial(r.death_year, r.death_month, r.death_day, false) : null,
    deathPlace: r.death_place,
    introduction: r.introduction,
    coverMediaId: r.cover_media_id,
    createdBy: r.created_by ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function storyColumns(p: Partial<NewStoryRecord> & { coverMediaId?: string | null }) {
  const out: Record<string, unknown> = {};
  if (p.subjectName !== undefined) out.subject_name = p.subjectName;
  if (p.knownAs !== undefined) out.known_as = p.knownAs;
  if (p.birthDate !== undefined) {
    out.birth_year = p.birthDate.year;
    out.birth_month = p.birthDate.month;
    out.birth_day = p.birthDate.day;
    out.birth_circa = p.birthDate.circa;
  }
  if (p.birthPlace !== undefined) out.birth_place = p.birthPlace;
  if (p.deathDate !== undefined) {
    out.death_year = p.deathDate?.year ?? null;
    out.death_month = p.deathDate?.month ?? null;
    out.death_day = p.deathDate?.day ?? null;
  }
  if (p.deathPlace !== undefined) out.death_place = p.deathPlace;
  if (p.introduction !== undefined) out.introduction = p.introduction;
  if (p.coverMediaId !== undefined) out.cover_media_id = p.coverMediaId;
  return out;
}

function toChapter(r: ChapterRow): Chapter {
  return { id: r.id, storyId: r.story_id, title: r.title, startYear: r.start_year, summary: r.summary };
}

function toMedia(r: MediaRow, url: string | null): Media {
  return {
    id: r.id,
    storyId: r.story_id,
    momentId: r.moment_id,
    kind: r.kind,
    path: r.path,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes),
    width: r.width,
    height: r.height,
    durationSeconds: r.duration_seconds === null ? null : Number(r.duration_seconds),
    caption: r.caption,
    uploadedBy: r.uploaded_by ?? "",
    createdAt: r.created_at,
    url,
  };
}

function momentColumns(r: MomentRecord) {
  return {
    title: r.title,
    body: r.body,
    date_year: r.date.year,
    date_month: r.date.month,
    date_day: r.date.day,
    date_circa: r.date.circa,
    place: r.place,
    people: r.people,
    is_milestone: r.isMilestone,
  };
}

function fail(error: { message: string; code?: string } | null, what: string): never {
  const code = error?.code;
  if (code === "42501") throw new RepositoryError(`You don't have permission to ${what}.`, "forbidden");
  if (code === "23505") throw new RepositoryError(`That ${what} conflicts with something that already exists.`, "conflict");
  if (code === "PGRST116") throw new RepositoryError(`Couldn't find that ${what}.`, "not_found");
  throw new RepositoryError(error?.message ? `Couldn't ${what}: ${error.message}` : `Couldn't ${what}.`);
}

/* ----------------------------------------------------------- repository */

export class SupabaseRepository implements Repository {
  constructor(private readonly db: SupabaseClient) {}

  private async signUrls(paths: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(paths)];
    const map = new Map<string, string>();
    if (unique.length === 0) return map;
    const { data, error } = await this.db.storage.from(MEDIA_BUCKET).createSignedUrls(unique, SIGNED_URL_SECONDS);
    if (error || !data) return map;
    for (const item of data) {
      if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
    }
    return map;
  }

  private async relationships(storyId: string): Promise<Map<string, string | null>> {
    const { data } = await this.db.from("story_members").select("user_id, relationship").eq("story_id", storyId);
    return new Map((data ?? []).map((r: { user_id: string; relationship: string | null }) => [r.user_id, r.relationship]));
  }

  private async hydrateMoments(rows: MomentRow[]): Promise<Moment[]> {
    if (rows.length === 0) return [];
    const allMedia = rows.flatMap((r) => r.media ?? []);
    const urls = await this.signUrls(allMedia.map((m) => m.path));
    const rel = await this.relationships(rows[0].story_id);
    return rows.map((r) => ({
      id: r.id,
      storyId: r.story_id,
      title: r.title,
      body: r.body,
      date: partial(r.date_year, r.date_month, r.date_day, r.date_circa),
      place: r.place,
      people: r.people ?? [],
      isMilestone: r.is_milestone,
      status: r.status,
      contributorId: r.contributor_id ?? "",
      contributorName: r.contributor?.display_name ?? "A former member",
      contributorRelationship: r.contributor_id ? (rel.get(r.contributor_id) ?? null) : null,
      reviewNote: r.review_note,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      publishedAt: r.published_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      media: (r.media ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((m) => toMedia(m, urls.get(m.path) ?? null)),
    }));
  }

  /* ---------------------------------------------------------- stories */

  async listStoriesForUser(userId: string): Promise<StorySummary[]> {
    const { data, error } = await this.db
      .from("story_members")
      .select("role, story:stories(*)")
      .eq("user_id", userId);
    if (error) fail(error, "load your stories");
    const rows = (data ?? []) as unknown as { role: Role; story: StoryRow | null }[];
    const stories = rows.filter((r) => r.story).map((r) => ({ role: r.role, story: toStory(r.story!) }));
    if (stories.length === 0) return [];
    const ids = stories.map((s) => s.story.id);

    const [{ data: momentRows }, { data: memberRows }, { data: coverRows }] = await Promise.all([
      this.db.from("moments").select("story_id, status").in("story_id", ids),
      this.db.from("story_members").select("story_id").in("story_id", ids),
      this.db
        .from("media")
        .select("id, path")
        .in("id", stories.map((s) => s.story.coverMediaId).filter((x): x is string => Boolean(x))),
    ]);
    const coverPaths = new Map((coverRows ?? []).map((m: { id: string; path: string }) => [m.id, m.path]));
    const urls = await this.signUrls([...coverPaths.values()]);

    return stories
      .map(({ role, story }) => {
        const ms = (momentRows ?? []).filter((m: { story_id: string }) => m.story_id === story.id) as {
          status: MomentStatus;
        }[];
        const coverPath = story.coverMediaId ? coverPaths.get(story.coverMediaId) : undefined;
        return {
          ...story,
          role,
          coverUrl: coverPath ? (urls.get(coverPath) ?? null) : null,
          publishedCount: ms.filter((m) => m.status === "published").length,
          awaitingReviewCount: ms.filter((m) => m.status === "pending").length,
          memberCount: (memberRows ?? []).filter((m: { story_id: string }) => m.story_id === story.id).length,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getStoryBySlug(slug: string) {
    const { data, error } = await this.db.from("stories").select("*").eq("slug", slug).maybeSingle();
    if (error) fail(error, "load the story");
    return data ? toStory(data as StoryRow) : null;
  }

  async getStoryById(id: string) {
    const { data, error } = await this.db.from("stories").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "load the story");
    return data ? toStory(data as StoryRow) : null;
  }

  async isSlugTaken(slug: string) {
    // Only visible stories can be counted here; a clash with a story the user
    // cannot see is caught by the unique constraint in createStory.
    const { count } = await this.db.from("stories").select("id", { count: "exact", head: true }).eq("slug", slug);
    return (count ?? 0) > 0;
  }

  async getRole(storyId: string, userId: string): Promise<Role | null> {
    const { data } = await this.db
      .from("story_members")
      .select("role")
      .eq("story_id", storyId)
      .eq("user_id", userId)
      .maybeSingle();
    return (data?.role as Role | undefined) ?? null;
  }

  async createStory(record: NewStoryRecord): Promise<Story> {
    // Inserted with return=minimal: the keeper membership that makes the row
    // readable is created by a trigger after the insert.
    const { error } = await this.db.from("stories").insert({
      id: record.id,
      slug: record.slug,
      created_by: record.createdBy,
      ...storyColumns(record),
    });
    if (error) {
      if (error.code === "23505") throw new RepositoryError("slug_taken", "conflict");
      fail(error, "create the story");
    }
    const story = await this.getStoryById(record.id);
    if (!story) throw new RepositoryError("The story was created but could not be read back.");
    return story;
  }

  async updateStory(id: string, patch: StoryPatch) {
    const { error } = await this.db.from("stories").update(storyColumns(patch)).eq("id", id);
    if (error) fail(error, "save the story");
    const story = await this.getStoryById(id);
    if (!story) throw new RepositoryError("Story not found", "not_found");
    return story;
  }

  async deleteStory(id: string) {
    const { data: files } = await this.db.from("media").select("path").eq("story_id", id);
    const { error } = await this.db.from("stories").delete().eq("id", id);
    if (error) fail(error, "delete the story");
    await this.removeMediaObjects((files ?? []).map((f: { path: string }) => f.path));
  }

  /* --------------------------------------------------------- chapters */

  async listChapters(storyId: string) {
    const { data, error } = await this.db.from("chapters").select("*").eq("story_id", storyId).order("start_year");
    if (error) fail(error, "load chapters");
    return (data as ChapterRow[]).map(toChapter);
  }

  async getChapter(id: string) {
    const { data } = await this.db.from("chapters").select("*").eq("id", id).maybeSingle();
    return data ? toChapter(data as ChapterRow) : null;
  }

  async createChapter(storyId: string, input: Omit<Chapter, "id" | "storyId">) {
    const { data, error } = await this.db
      .from("chapters")
      .insert({ story_id: storyId, title: input.title, start_year: input.startYear, summary: input.summary })
      .select("*")
      .single();
    if (error?.code === "23505") throw new RepositoryError("Another chapter already begins in that year.", "conflict");
    if (error) fail(error, "add the chapter");
    return toChapter(data as ChapterRow);
  }

  async updateChapter(id: string, input: Omit<Chapter, "id" | "storyId">) {
    const { data, error } = await this.db
      .from("chapters")
      .update({ title: input.title, start_year: input.startYear, summary: input.summary })
      .eq("id", id)
      .select("*")
      .single();
    if (error?.code === "23505") throw new RepositoryError("Another chapter already begins in that year.", "conflict");
    if (error) fail(error, "save the chapter");
    return toChapter(data as ChapterRow);
  }

  async deleteChapter(id: string) {
    const { error } = await this.db.from("chapters").delete().eq("id", id);
    if (error) fail(error, "remove the chapter");
  }

  /* ---------------------------------------------------------- moments */

  async listMoments(storyId: string, filter: { statuses?: MomentStatus[]; contributorId?: string } = {}) {
    let query = this.db.from("moments").select(MOMENT_SELECT).eq("story_id", storyId);
    if (filter.statuses) query = query.in("status", filter.statuses);
    if (filter.contributorId) query = query.eq("contributor_id", filter.contributorId);
    const { data, error } = await query.order("sort_key").order("created_at");
    if (error) fail(error, "load moments");
    return this.hydrateMoments((data ?? []) as unknown as MomentRow[]);
  }

  async getMoment(id: string) {
    const { data, error } = await this.db.from("moments").select(MOMENT_SELECT).eq("id", id).maybeSingle();
    if (error) fail(error, "load the moment");
    if (!data) return null;
    const [moment] = await this.hydrateMoments([data as unknown as MomentRow]);
    return moment;
  }

  async countMoments(storyId: string, status: MomentStatus) {
    const { count } = await this.db
      .from("moments")
      .select("id", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("status", status);
    return count ?? 0;
  }

  async createMoment(record: NewMomentRecord) {
    const { error } = await this.db.from("moments").insert({
      id: record.id,
      story_id: record.storyId,
      status: record.status,
      ...momentColumns(record),
    });
    if (error) fail(error, "save the moment");
    const moment = await this.getMoment(record.id);
    if (!moment) throw new RepositoryError("The moment was saved but could not be read back.");
    return moment;
  }

  async updateMomentContent(id: string, record: MomentRecord, resubmit: boolean) {
    const update: Record<string, unknown> = momentColumns(record);
    if (resubmit) update.status = "pending";
    const { error } = await this.db.from("moments").update(update).eq("id", id);
    if (error) fail(error, "save the moment");
    const moment = await this.getMoment(id);
    if (!moment) throw new RepositoryError("Moment not found", "not_found");
    return moment;
  }

  async reviewMoment(id: string, patch: MomentReviewPatch) {
    const update: Record<string, unknown> = { status: patch.status, review_note: patch.reviewNote };
    if (patch.isMilestone !== undefined) update.is_milestone = patch.isMilestone;
    const { error } = await this.db.from("moments").update(update).eq("id", id);
    if (error) fail(error, "record the review");
    const moment = await this.getMoment(id);
    if (!moment) throw new RepositoryError("Moment not found", "not_found");
    return moment;
  }

  async deleteMoment(id: string) {
    const { data: files } = await this.db.from("media").select("path").eq("moment_id", id);
    const { error } = await this.db.from("moments").delete().eq("id", id);
    if (error) fail(error, "remove the moment");
    await this.removeMediaObjects((files ?? []).map((f: { path: string }) => f.path));
  }

  /* ------------------------------------------------------------ media */

  async createUploadTarget(_storyId: string, _mediaId: string, path: string): Promise<UploadTarget> {
    const { data, error } = await this.db.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error || !data) fail(error ? { message: error.message } : null, "prepare the upload");
    return { strategy: "supabase-signed", path: data.path, token: data.token };
  }

  async confirmUpload(path: string) {
    const { data } = await this.db.storage.from(MEDIA_BUCKET).exists(path);
    return Boolean(data);
  }

  async createMedia(record: NewMediaRecord) {
    const { data, error } = await this.db
      .from("media")
      .insert({
        id: record.id,
        story_id: record.storyId,
        kind: record.kind,
        path: record.path,
        mime_type: record.mimeType,
        size_bytes: record.sizeBytes,
        width: record.width,
        height: record.height,
        duration_seconds: record.durationSeconds,
      })
      .select("*")
      .single();
    if (error) fail(error, "save the file");
    const urls = await this.signUrls([record.path]);
    return toMedia(data as MediaRow, urls.get(record.path) ?? null);
  }

  async getMedia(ids: string[]) {
    if (ids.length === 0) return [];
    const { data, error } = await this.db.from("media").select("*").in("id", ids);
    if (error) fail(error, "load files");
    const rows = (data ?? []) as MediaRow[];
    const urls = await this.signUrls(rows.map((r) => r.path));
    return rows.map((r) => toMedia(r, urls.get(r.path) ?? null));
  }

  async listStoryImages(storyId: string) {
    const { data, error } = await this.db
      .from("media")
      .select("*, moment:moments!media_moment_id_fkey(status)")
      .eq("story_id", storyId)
      .eq("kind", "image")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) fail(error, "load photographs");
    const rows = ((data ?? []) as (MediaRow & { moment: { status: MomentStatus } | null; purpose?: string })[]).filter(
      (r) => r.moment?.status === "published" || r.purpose === "cover",
    );
    const urls = await this.signUrls(rows.map((r) => r.path));
    return rows.map((r) => toMedia(r, urls.get(r.path) ?? null));
  }

  async attachMedia(momentId: string, mediaIds: string[], captions: Record<string, string | null>) {
    for (const [index, id] of mediaIds.entries()) {
      const update: Record<string, unknown> = { moment_id: momentId, position: index };
      if (id in captions) update.caption = captions[id];
      const { error } = await this.db.from("media").update(update).eq("id", id);
      if (error) fail(error, "attach the file");
    }
  }

  async detachMedia(momentId: string, keepIds: string[]) {
    let query = this.db.from("media").select("id, path").eq("moment_id", momentId);
    if (keepIds.length) query = query.not("id", "in", `(${keepIds.join(",")})`);
    const { data } = await query;
    const removed = (data ?? []) as { id: string; path: string }[];
    if (removed.length) {
      const { error } = await this.db.from("media").delete().in("id", removed.map((r) => r.id));
      if (error) fail(error, "remove files");
      await this.removeMediaObjects(removed.map((r) => r.path));
    }
    return removed.map((r) => r.path);
  }

  async removeMediaObjects(paths: string[]) {
    if (paths.length === 0) return;
    await this.db.storage.from(MEDIA_BUCKET).remove(paths);
  }

  /* ---------------------------------------------------------- members */

  async listMembers(storyId: string): Promise<Member[]> {
    const { data, error } = await this.db
      .from("story_members")
      .select("story_id, user_id, role, relationship, joined_at, profile:profiles(display_name)")
      .eq("story_id", storyId);
    if (error) fail(error, "load members");
    const order: Record<Role, number> = { owner: 0, editor: 1, contributor: 2, viewer: 3 };
    return (
      (data ?? []) as unknown as {
        story_id: string;
        user_id: string;
        role: Role;
        relationship: string | null;
        joined_at: string;
        profile: { display_name: string } | null;
      }[]
    )
      .map((r) => ({
        storyId: r.story_id,
        userId: r.user_id,
        role: r.role,
        relationship: r.relationship,
        joinedAt: r.joined_at,
        displayName: r.profile?.display_name ?? "Family member",
        // Email addresses live in auth.users and are not exposed to other members.
        email: null,
      }))
      .sort((a, b) => order[a.role] - order[b.role] || a.displayName.localeCompare(b.displayName));
  }

  async updateMemberRole(storyId: string, userId: string, role: Exclude<Role, "owner">) {
    const { error } = await this.db.from("story_members").update({ role }).eq("story_id", storyId).eq("user_id", userId);
    if (error) fail(error, "change their role");
  }

  async removeMember(storyId: string, userId: string) {
    const { error } = await this.db.from("story_members").delete().eq("story_id", storyId).eq("user_id", userId);
    if (error) fail(error, "remove the member");
  }

  /* ------------------------------------------------------ invitations */

  private toInvitation(r: InvitationRow): Invitation {
    return {
      id: r.id,
      storyId: r.story_id,
      email: r.email,
      role: r.role,
      relationship: r.relationship,
      invitedBy: r.invited_by ?? "",
      invitedByName: r.inviter?.display_name ?? "A family member",
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      acceptedAt: r.accepted_at,
      revokedAt: r.revoked_at,
    };
  }

  async listInvitations(storyId: string) {
    const { data, error } = await this.db
      .from("invitations")
      .select("id, story_id, email, role, relationship, invited_by, created_at, expires_at, accepted_at, revoked_at, inviter:profiles!invitations_invited_by_fkey(display_name)")
      .eq("story_id", storyId)
      .order("created_at", { ascending: false });
    if (error) fail(error, "load invitations");
    return ((data ?? []) as unknown as InvitationRow[]).map((r) => this.toInvitation(r));
  }

  async createInvitation(record: NewInvitationRecord) {
    const { data, error } = await this.db
      .from("invitations")
      .insert({
        story_id: record.storyId,
        email: record.email,
        role: record.role,
        relationship: record.relationship,
        token_hash: record.tokenHash,
        invited_by: record.invitedBy,
        expires_at: record.expiresAt,
      })
      .select("id, story_id, email, role, relationship, invited_by, created_at, expires_at, accepted_at, revoked_at, inviter:profiles!invitations_invited_by_fkey(display_name)")
      .single();
    if (error) fail(error, "create the invitation");
    return this.toInvitation(data as unknown as InvitationRow);
  }

  async revokeInvitation(id: string) {
    const { error } = await this.db
      .from("invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .is("accepted_at", null);
    if (error) fail(error, "withdraw the invitation");
  }

  async previewInvitation(token: string): Promise<InvitationPreview | null> {
    const { data, error } = await this.db.rpc("invitation_preview", { p_token: token });
    if (error) fail(error, "check the invitation");
    const row = (data as unknown as {
      story_subject: string;
      story_known_as: string | null;
      invited_by_name: string | null;
      role: Exclude<Role, "owner">;
      email: string;
      state: InvitationPreview["state"];
    }[])?.[0];
    if (!row) return null;
    return {
      subjectName: row.story_subject,
      knownAs: row.story_known_as,
      invitedByName: row.invited_by_name,
      role: row.role,
      email: row.email,
      state: row.state,
    };
  }

  async acceptInvitation(token: string): Promise<string> {
    const { data, error } = await this.db.rpc("accept_invitation", { p_token: token });
    if (error) {
      const code = error.code === "42501" ? "forbidden" : error.code === "P0002" ? "not_found" : "conflict";
      throw new RepositoryError(error.message.endsWith(".") ? error.message : `${error.message}.`, code);
    }
    return data as string;
  }
}
