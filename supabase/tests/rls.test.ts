/**
 * Runs TimeLyn's real migrations in an embedded Postgres and checks the
 * Row Level Security rules from the point of view of each kind of member.
 */
import { readFileSync, readdirSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
let db: PGlite;

const users = {
  keeper: { id: randomUUID(), email: "ruth@example.com", name: "Ruth" },
  editor: { id: randomUUID(), email: "david@example.com", name: "David" },
  contributor: { id: randomUUID(), email: "tom@example.com", name: "Tom" },
  reader: { id: randomUUID(), email: "ann@example.com", name: "Ann" },
  stranger: { id: randomUUID(), email: "stranger@example.com", name: "Stranger" },
};
type Who = keyof typeof users;

const sha = (t: string) => createHash("sha256").update(t, "utf8").digest("hex");

async function as<T = Record<string, unknown>>(who: Who | null, sql: string, params: unknown[] = []) {
  await db.exec("reset role");
  if (who) {
    const u = users[who];
    await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [
      u.id,
      JSON.stringify({ sub: u.id, email: u.email }),
    ]);
    await db.exec("set role authenticated");
  } else {
    await db.query(`select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false)`);
    await db.exec("set role anon");
  }
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role");
  }
}

let storyId = "";
let otherStoryId = "";

async function invite(by: Who, email: string, role: string) {
  const token = randomUUID() + randomUUID();
  await as(by, `insert into public.invitations (story_id, email, role, token_hash, invited_by) values ($1, $2, $3, $4, auth.uid())`, [
    storyId,
    email,
    role,
    sha(token),
  ]);
  return token;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(path.join(root, "tests/supabase-stubs.sql"), "utf8"));
  const migrations = readdirSync(path.join(root, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const file of migrations) {
    await db.exec(readFileSync(path.join(root, "migrations", file), "utf8"));
  }
  // Supabase grants table privileges to these roles by default; RLS does the rest.
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select on all tables in schema public to anon;
  `);
  for (const u of Object.values(users)) {
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
      u.id,
      u.email,
      JSON.stringify({ display_name: u.name }),
    ]);
  }
}, 60_000);

describe("profiles", () => {
  it("are created for new users from their sign-up name", async () => {
    const rows = await as("keeper", `select display_name from public.profiles where id = auth.uid()`);
    expect(rows).toEqual([{ display_name: "Ruth" }]);
  });
});

describe("starting a story", () => {
  it("makes the creator the story keeper and opens a first chapter", async () => {
    storyId = randomUUID();
    await as("keeper", `insert into public.stories (id, slug, subject_name, birth_year, created_by) values ($1, 'margaret-ellison', 'Margaret Ellison', 1951, auth.uid())`, [storyId]);
    const members = await as("keeper", `select role from public.story_members where story_id = $1`, [storyId]);
    expect(members).toEqual([{ role: "owner" }]);
    const chapters = await as("keeper", `select title, start_year from public.chapters where story_id = $1`, [storyId]);
    expect(chapters).toEqual([{ title: "Early years", start_year: 1951 }]);
  });

  // RETURNING is checked before the keeper membership exists, so the app
  // inserts with return=minimal and reads the story back afterwards.
  it("is readable by its creator straight after creation", async () => {
    await as("stranger", `insert into public.stories (slug, subject_name, birth_year, created_by) values ('strangers-story', 'S', 1960, auth.uid())`);
    const rows = await as("stranger", `select slug from public.stories where slug = 'strangers-story'`);
    expect(rows).toEqual([{ slug: "strangers-story" }]);
    await as("stranger", `delete from public.stories where slug = 'strangers-story'`);
  });

  it("cannot be done on someone else's behalf", async () => {
    await expect(
      as("stranger", `insert into public.stories (slug, subject_name, birth_year, created_by) values ('x-story', 'X', 1950, $1)`, [users.keeper.id]),
    ).rejects.toThrow(/row-level security/);
  });

  it("is invisible to people who are not members", async () => {
    expect(await as("stranger", `select id from public.stories`)).toEqual([]);
    expect(await as("stranger", `select story_id from public.story_members`)).toEqual([]);
    expect(await as("stranger", `select id from public.chapters`)).toEqual([]);
    expect(await as(null, `select id from public.stories`)).toEqual([]);
  });
});

describe("invitations", () => {
  it("let the keeper bring in an editor, contributor and reader", async () => {
    for (const [who, role] of [["editor", "editor"], ["contributor", "contributor"], ["reader", "viewer"]] as const) {
      const token = await invite("keeper", users[who].email, role);
      const preview = await as(null, `select story_subject, role, state from public.invitation_preview($1)`, [token]);
      expect(preview).toEqual([{ story_subject: "Margaret Ellison", role, state: "open" }]);
      const [{ accept_invitation }] = await as<{ accept_invitation: string }>(who, `select public.accept_invitation($1)`, [token]);
      expect(accept_invitation).toBe("margaret-ellison");
    }
    const roles = await as("keeper", `select role from public.story_members where story_id = $1 order by role`, [storyId]);
    expect(roles.map((r) => r.role)).toEqual(["owner", "editor", "contributor", "viewer"]);
  });

  it("only work for the address they were sent to", async () => {
    const token = await invite("keeper", "someone-else@example.com", "viewer");
    await expect(as("stranger", `select public.accept_invitation($1)`, [token])).rejects.toThrow(/different email/);
  });

  it("cannot be used by anonymous visitors", async () => {
    const token = await invite("keeper", "x@example.com", "viewer");
    await expect(as(null, `select public.accept_invitation($1)`, [token])).rejects.toThrow();
  });

  it("do not let editors appoint other editors", async () => {
    await expect(invite("editor", "new-editor@example.com", "editor")).rejects.toThrow(/row-level security/);
    await expect(invite("editor", "new-reader@example.com", "viewer")).resolves.toBeTypeOf("string");
  });

  it("cannot be created by contributors", async () => {
    await expect(invite("contributor", "friend@example.com", "viewer")).rejects.toThrow(/row-level security/);
  });
});

describe("moments and review", () => {
  let momentId = "";

  it("from a contributor always wait for review, whatever the request says", async () => {
    const [row] = await as<{ id: string; status: string; is_milestone: boolean }>(
      "contributor",
      `insert into public.moments (story_id, title, date_year, status, is_milestone)
       values ($1, 'The day at Sandsend', 1959, 'published', true)
       returning id, status, is_milestone`,
      [storyId],
    );
    momentId = row.id;
    expect(row.status).toBe("pending");
    expect(row.is_milestone).toBe(false);
  });

  it("are hidden from readers until published", async () => {
    expect(await as("reader", `select id from public.moments where id = $1`, [momentId])).toEqual([]);
    expect(await as("editor", `select id from public.moments where id = $1`, [momentId])).toHaveLength(1);
  });

  it("cannot be published by their contributor", async () => {
    await as("contributor", `update public.moments set status = 'published', review_note = 'self' where id = $1`, [momentId]);
    const [row] = await as("editor", `select status, review_note from public.moments where id = $1`, [momentId]);
    expect(row).toEqual({ status: "pending", review_note: null });
  });

  it("can be returned with a note and resubmitted", async () => {
    await as("editor", `update public.moments set status = 'changes_requested', review_note = 'Which beach was this?' where id = $1`, [momentId]);
    await as("contributor", `update public.moments set place = 'Sandsend' where id = $1`, [momentId]);
    const [row] = await as("editor", `select status, place from public.moments where id = $1`, [momentId]);
    expect(row).toEqual({ status: "pending", place: "Sandsend" });
  });

  it("become visible to readers once published, with a review record", async () => {
    await as("keeper", `update public.moments set status = 'published', review_note = null where id = $1`, [momentId]);
    expect(await as("reader", `select title from public.moments where id = $1`, [momentId])).toEqual([{ title: "The day at Sandsend" }]);
    const log = await as("contributor", `select decision from public.moment_reviews where moment_id = $1 order by created_at`, [momentId]);
    expect(log.map((r) => r.decision)).toEqual(["request_changes", "publish"]);
  });

  it("are locked for their contributor once published", async () => {
    await as("contributor", `update public.moments set title = 'Changed' where id = $1`, [momentId]);
    await as("contributor", `delete from public.moments where id = $1`, [momentId]);
    expect(await as("reader", `select title from public.moments where id = $1`, [momentId])).toEqual([{ title: "The day at Sandsend" }]);
  });

  it("cannot be written by readers", async () => {
    await expect(
      as("reader", `insert into public.moments (story_id, title, date_year) values ($1, 'Nope', 1960)`, [storyId]),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("media", () => {
  let pendingMomentId = "";

  it("follows the visibility of its moment", async () => {
    const [m] = await as<{ id: string }>("contributor", `insert into public.moments (story_id, title, date_year) values ($1, 'Pending moment', 1960) returning id`, [storyId]);
    pendingMomentId = m.id;
    const mediaId = randomUUID();
    await as(
      "contributor",
      `insert into public.media (id, story_id, moment_id, kind, path, mime_type, size_bytes) values ($1, $2, $3, 'image', $4, 'image/jpeg', 1000)`,
      [mediaId, storyId, pendingMomentId, `${storyId}/${mediaId}.jpg`],
    );
    expect(await as("reader", `select id from public.media where id = $1`, [mediaId])).toEqual([]);
    await as("editor", `update public.moments set status = 'published' where id = $1`, [pendingMomentId]);
    expect(await as("reader", `select id from public.media where id = $1`, [mediaId])).toHaveLength(1);
  });

  it("must be stored in its story's folder", async () => {
    const mediaId = randomUUID();
    await expect(
      as("contributor", `insert into public.media (id, story_id, kind, path, mime_type, size_bytes) values ($1, $2, 'image', 'elsewhere/x.jpg', 'image/jpeg', 10)`, [mediaId, storyId]),
    ).rejects.toThrow(/media_path_in_story_folder/);
  });

  it("cannot be attached to a moment in another story", async () => {
    otherStoryId = randomUUID();
    await as("contributor", `insert into public.stories (id, slug, subject_name, birth_year, created_by) values ($1, 'toms-story', 'Tom', 1990, auth.uid())`, [otherStoryId]);
    const [m] = await as<{ id: string }>("contributor", `insert into public.moments (story_id, title, date_year) values ($1, 'Mine', 2000) returning id`, [otherStoryId]);
    const mediaId = randomUUID();
    await expect(
      as("contributor", `insert into public.media (id, story_id, moment_id, kind, path, mime_type, size_bytes) values ($1, $2, $3, 'image', $4, 'image/jpeg', 10)`, [mediaId, storyId, m.id, `${storyId}/${mediaId}.jpg`]),
    ).rejects.toThrow(/same story/);
  });

  it("uploads are limited to contributors of the story", async () => {
    await expect(
      as("reader", `insert into storage.objects (bucket_id, name) values ('story-media', $1)`, [`${storyId}/a.jpg`]),
    ).rejects.toThrow(/row-level security/);
    await expect(
      as("stranger", `insert into storage.objects (bucket_id, name) values ('story-media', $1)`, [`${storyId}/b.jpg`]),
    ).rejects.toThrow(/row-level security/);
    await expect(
      as("contributor", `insert into storage.objects (bucket_id, name) values ('story-media', $1)`, [`${storyId}/c.jpg`]),
    ).resolves.toBeDefined();
  });
});

describe("membership", () => {
  it("cannot be escalated by editors", async () => {
    await expect(
      as("editor", `update public.story_members set role = 'editor' where story_id = $1 and user_id = $2`, [storyId, users.reader.id]),
    ).rejects.toThrow(/row-level security/);
    const [row] = await as("keeper", `select role from public.story_members where story_id = $1 and user_id = $2`, [storyId, users.reader.id]);
    expect(row.role).toBe("viewer");
  });

  it("lets the keeper promote, but never creates a second keeper", async () => {
    await as("keeper", `update public.story_members set role = 'contributor' where story_id = $1 and user_id = $2`, [storyId, users.reader.id]);
    await as("keeper", `update public.story_members set role = 'owner' where story_id = $1 and user_id = $2`, [storyId, users.reader.id]).catch(() => undefined);
    const [row] = await as("keeper", `select role from public.story_members where story_id = $1 and user_id = $2`, [storyId, users.reader.id]);
    expect(row.role).toBe("contributor");
  });

  it("does not let anyone remove the keeper", async () => {
    await as("editor", `delete from public.story_members where story_id = $1 and user_id = $2`, [storyId, users.keeper.id]);
    expect(await as("keeper", `select 1 from public.story_members where story_id = $1 and user_id = $2`, [storyId, users.keeper.id])).toHaveLength(1);
  });
});

describe("deleting a story", () => {
  it("is reserved for its keeper", async () => {
    await as("editor", `delete from public.stories where id = $1`, [storyId]);
    expect(await as("keeper", `select id from public.stories where id = $1`, [storyId])).toHaveLength(1);
    await as("keeper", `delete from public.stories where id = $1`, [storyId]);
    expect(await as("keeper", `select id from public.stories where id = $1`, [storyId])).toEqual([]);
  });
});
