import { beforeEach, describe, expect, it } from "vitest";
import { DemoRepository, demoState, resetDemoState } from "@/lib/data/demo/store";
import { USERS } from "@/lib/data/demo/seed";
import type { Viewer } from "@/lib/domain/types";
import { momentSchema, storySchema } from "@/lib/validation";
import { ServiceError } from "./errors";
import { acceptInvitation, changeRole, invite, removeMember } from "./members";
import { arrangeTimeline, editMoment, loadTimeline, reviewMoment, submitMoment } from "./moments";
import { accessStory, createStory, removeChapter, saveChapter } from "./stories";

const repo = new DemoRepository();
const viewer = (id: string): Viewer => {
  const u = repo.findUser(id)!;
  return { id: u.id, displayName: u.displayName, email: u.email };
};
const ruth = () => viewer(USERS.ruth);
const tom = () => viewer(USERS.tom);
const david = () => viewer(USERS.david);
const sandra = () => viewer(USERS.sandra);

function form(fields: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) f.append(k, x);
  return Object.fromEntries([...f.keys()].map((k) => [k, f.getAll(k).length > 1 ? f.getAll(k) : f.get(k)]));
}

const moment = (fields: Record<string, string>) => momentSchema.parse(form({ title: "A moment", year: "1980", ...fields }));

beforeEach(() => resetDemoState());

describe("stories", () => {
  it("are invisible to non-members", async () => {
    const outsider = repo.createUser("Out Sider", "out@example.com");
    await expect(accessStory(repo, { id: outsider.id, displayName: "", email: outsider.email }, "peggy-ellison")).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("get a readable, unique address", async () => {
    const input = storySchema.parse(form({ subjectName: "Margaret Ellison", knownAs: "Peggy", birthYear: "1930" }));
    const story = await createStory(repo, ruth(), input);
    expect(story.slug).toBe("peggy-ellison-2");
    const access = await accessStory(repo, ruth(), story.slug);
    expect(access.role).toBe("owner");
    expect(await repo.listChapters(story.id)).toHaveLength(1);
  });

  it("validate remembered people need a year of death after their birth", () => {
    const bad = storySchema.safeParse(form({ subjectName: "W", birthYear: "1950", remembered: "on", deathYear: "1940" }));
    expect(bad.success).toBe(false);
  });

  it("keep at least one chapter, and chapters can't start before birth", async () => {
    const access = await accessStory(repo, ruth(), "walter-ellison");
    await expect(saveChapter(repo, access, null, { title: "Before", startYear: 1900, summary: null })).rejects.toBeInstanceOf(ServiceError);
    const chapters = await repo.listChapters(access.story.id);
    for (const c of chapters.slice(1)) await removeChapter(repo, access, c.id);
    await expect(removeChapter(repo, access, chapters[0].id)).rejects.toMatchObject({ code: "invalid" });
  });
});

describe("contributing and reviewing", () => {
  it("holds contributor moments for review and ignores their milestone flag", async () => {
    const access = await accessStory(repo, tom(), "peggy-ellison");
    const m = await submitMoment(repo, access, tom(), moment({ isMilestone: "on" }), {});
    expect(m.status).toBe("pending");
    expect(m.isMilestone).toBe(false);
  });

  it("publishes directly for keepers and editors", async () => {
    const access = await accessStory(repo, david(), "peggy-ellison");
    const m = await submitMoment(repo, access, david(), moment({ isMilestone: "on" }), {});
    expect(m.status).toBe("published");
    expect(m.isMilestone).toBe(true);
  });

  it("does not let readers contribute", async () => {
    const access = await accessStory(repo, sandra(), "walter-ellison");
    await expect(submitMoment(repo, access, sandra(), moment({}), {})).rejects.toMatchObject({ code: "forbidden" });
  });

  it("runs the full review loop", async () => {
    const tomAccess = await accessStory(repo, tom(), "peggy-ellison");
    const m = await submitMoment(repo, tomAccess, tom(), moment({ title: "First go" }), {});

    const ruthAccess = await accessStory(repo, ruth(), "peggy-ellison");
    await expect(reviewMoment(repo, ruthAccess, ruth(), m.id, "request_changes", null)).rejects.toMatchObject({ code: "invalid" });
    const returned = await reviewMoment(repo, ruthAccess, ruth(), m.id, "request_changes", "Which year?");
    expect(returned.status).toBe("changes_requested");

    const edited = await editMoment(repo, tomAccess, tom(), m.id, moment({ title: "Second go", year: "1981" }), {});
    expect(edited.status).toBe("pending");

    const published = await reviewMoment(repo, ruthAccess, ruth(), m.id, "publish", null, true);
    expect(published.status).toBe("published");
    expect(published.isMilestone).toBe(true);

    await expect(editMoment(repo, tomAccess, tom(), m.id, moment({ title: "Sneaky" }), {})).rejects.toMatchObject({ code: "forbidden" });
  });

  it("stops contributors reviewing", async () => {
    const access = await accessStory(repo, tom(), "peggy-ellison");
    const pending = demoState().moments.find((x) => x.status === "pending" && x.contributorId !== USERS.tom)!;
    await expect(reviewMoment(repo, access, tom(), pending.id, "publish", null)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("refuses media from another story or another person", async () => {
    const access = await accessStory(repo, tom(), "peggy-ellison");
    const someoneElses = demoState().media.find((x) => x.uploadedBy !== USERS.tom)!;
    await expect(
      submitMoment(repo, access, tom(), moment({ mediaIds: someoneElses.id }), {}),
    ).rejects.toMatchObject({ code: "invalid" });
  });
});

describe("timeline", () => {
  it("places every published moment in exactly one chapter, in date order", async () => {
    const access = await accessStory(repo, sandra(), "peggy-ellison");
    const { chapters, published } = await loadTimeline(repo, access, sandra());
    const placed = chapters.flatMap((c) => c.moments.map((m) => m.id));
    expect(new Set(placed).size).toBe(published.length);
    expect(placed.length).toBe(published.length);
    for (const c of chapters) {
      for (const m of c.moments) {
        expect(m.date.year).toBeGreaterThanOrEqual(c.chapter.startYear);
        if (c.endYear) expect(m.date.year).toBeLessThanOrEqual(c.endYear);
      }
    }
  });

  it("puts moments from before the first chapter into the first chapter", () => {
    const chapters = [{ id: "c", storyId: "s", title: "T", startYear: 1950, summary: null }];
    const m = { id: "m", date: { year: 1930, month: null, day: null, circa: false }, createdAt: "" } as never;
    expect(arrangeTimeline(chapters, [m])[0].moments).toHaveLength(1);
  });
});

describe("invitations and members", () => {
  it("lets an invited person join with the right role, once", async () => {
    const access = await accessStory(repo, david(), "peggy-ellison");
    const { token } = await invite(repo, access, david(), { email: "aunt.jean@example.com", role: "viewer", relationship: "Sister" });
    const jean = repo.createUser("Jean Hartley", "aunt.jean@example.com");
    const slug = await acceptInvitation(repo, { id: jean.id, displayName: jean.displayName, email: jean.email }, token);
    expect(slug).toBe("peggy-ellison");
    expect(await repo.getRole(access.story.id, jean.id)).toBe("viewer");
    const other = repo.createUser("Other", "other@example.com");
    await expect(acceptInvitation(repo, { id: other.id, displayName: "", email: other.email }, token)).rejects.toBeInstanceOf(ServiceError);
  });

  it("won't accept an invitation sent to someone else", async () => {
    const access = await accessStory(repo, ruth(), "peggy-ellison");
    const { token } = await invite(repo, access, ruth(), { email: "cousin@example.com", role: "contributor", relationship: null });
    await expect(acceptInvitation(repo, sandra(), token)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("stops editors appointing editors or removing the keeper", async () => {
    const access = await accessStory(repo, david(), "peggy-ellison");
    await expect(invite(repo, access, david(), { email: "x@example.com", role: "editor", relationship: null })).rejects.toMatchObject({ code: "forbidden" });
    await expect(changeRole(repo, access, david(), USERS.tom, "editor")).rejects.toMatchObject({ code: "forbidden" });
    await expect(removeMember(repo, access, david(), USERS.ruth)).rejects.toMatchObject({ code: "forbidden" });
    await changeRole(repo, access, david(), USERS.tom, "viewer");
    expect(await repo.getRole(access.story.id, USERS.tom)).toBe("viewer");
  });
});
