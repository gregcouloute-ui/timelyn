import { z } from "zod";
import { isInFuture, isValidPartialDate, sortKey } from "./domain/dates";
import type { PartialDate } from "./domain/types";

/* ------------------------------------------------------------------ helpers */

const emptyToNull = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? null : v;
const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const optionalText = (max: number) =>
  z.preprocess(emptyToNull, trimmed(max).nullable()).default(null);
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const yearField = z.coerce
  .number({ error: "Enter a year, for example 1974." })
  .int("Enter a whole year, for example 1974.")
  .min(1800, "Enter a year after 1800.")
  .max(2200, "That year is in the future.");
const optionalInt = (min: number, max: number, message: string) =>
  z.preprocess(emptyToNull, z.coerce.number().int().min(min, message).max(max, message).nullable());

export const partialDateFields = {
  year: yearField,
  month: optionalInt(1, 12, "Choose a month."),
  day: optionalInt(1, 31, "Enter a day between 1 and 31."),
  circa: checkbox,
};

function toPartialDate(v: { year: number; month: number | null; day: number | null; circa: boolean }): PartialDate {
  return { year: v.year, month: v.month, day: v.month === null ? null : v.day, circa: v.circa };
}

const peopleList = z
  .preprocess(
    (v) =>
      typeof v === "string"
        ? v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : v,
    z.array(trimmed(60)).max(20, "List up to 20 people."),
  )
  .default([]);

const uuidList = z.preprocess(
  (v) => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []),
  z.array(z.uuid()).max(24, "Add up to 24 files to a single moment."),
);

/* ------------------------------------------------------------------- moment */

export const momentSchema = z
  .object({
    title: trimmed(120).min(1, "Give this moment a title."),
    body: optionalText(8000),
    ...partialDateFields,
    place: optionalText(120),
    people: peopleList,
    isMilestone: checkbox,
    mediaIds: uuidList,
  })
  .transform((v) => ({
    title: v.title,
    body: v.body,
    date: toPartialDate(v),
    place: v.place,
    people: v.people,
    isMilestone: v.isMilestone,
    mediaIds: v.mediaIds,
  }))
  .superRefine((v, ctx) => {
    if (!isValidPartialDate(v.date)) {
      ctx.addIssue({ code: "custom", path: ["day"], message: "That date doesn't exist. Check the day and month." });
    } else if (isInFuture(v.date)) {
      ctx.addIssue({ code: "custom", path: ["year"], message: "Moments can't be dated in the future." });
    }
  });

export type MomentInput = z.output<typeof momentSchema>;

/* -------------------------------------------------------------------- story */

export const storySchema = z
  .object({
    subjectName: trimmed(120).min(1, "Enter their full name."),
    knownAs: optionalText(60),
    birthYear: yearField,
    birthMonth: optionalInt(1, 12, "Choose a month."),
    birthDay: optionalInt(1, 31, "Enter a day between 1 and 31."),
    birthCirca: checkbox,
    birthPlace: optionalText(120),
    remembered: checkbox,
    deathYear: z.preprocess(emptyToNull, yearField.nullable()),
    deathMonth: optionalInt(1, 12, "Choose a month."),
    deathDay: optionalInt(1, 31, "Enter a day between 1 and 31."),
    deathPlace: optionalText(120),
    introduction: optionalText(2000),
  })
  .transform((v) => ({
    subjectName: v.subjectName,
    knownAs: v.knownAs,
    birthDate: toPartialDate({ year: v.birthYear, month: v.birthMonth, day: v.birthDay, circa: v.birthCirca }),
    birthPlace: v.birthPlace,
    deathDate:
      v.remembered && v.deathYear !== null
        ? toPartialDate({ year: v.deathYear, month: v.deathMonth, day: v.deathDay, circa: false })
        : null,
    deathPlace: v.remembered ? v.deathPlace : null,
    introduction: v.introduction,
    remembered: v.remembered,
  }))
  .superRefine((v, ctx) => {
    if (!isValidPartialDate(v.birthDate)) {
      ctx.addIssue({ code: "custom", path: ["birthDay"], message: "That date of birth doesn't exist." });
    } else if (isInFuture(v.birthDate)) {
      ctx.addIssue({ code: "custom", path: ["birthYear"], message: "The date of birth can't be in the future." });
    }
    if (v.remembered && !v.deathDate) {
      ctx.addIssue({ code: "custom", path: ["deathYear"], message: "Enter the year they died." });
    }
    if (v.deathDate) {
      if (!isValidPartialDate(v.deathDate)) {
        ctx.addIssue({ code: "custom", path: ["deathDay"], message: "That date doesn't exist." });
      } else if (sortKey(v.deathDate) < sortKey(v.birthDate)) {
        ctx.addIssue({ code: "custom", path: ["deathYear"], message: "This is before their date of birth." });
      } else if (isInFuture(v.deathDate)) {
        ctx.addIssue({ code: "custom", path: ["deathYear"], message: "This date is in the future." });
      }
    }
  });

export type StoryInput = z.output<typeof storySchema>;

/* ------------------------------------------------------------------ chapter */

export const chapterSchema = z.object({
  title: trimmed(80).min(1, "Give the chapter a title."),
  startYear: yearField,
  summary: optionalText(600),
});

export type ChapterInput = z.output<typeof chapterSchema>;

/* --------------------------------------------------------------- invitation */

export const invitationSchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.email("Enter an email address, like name@example.com."),
  ),
  role: z.enum(["editor", "contributor", "viewer"], { error: "Choose what they can do." }),
  relationship: optionalText(60),
});

export type InvitationInput = z.output<typeof invitationSchema>;

export const memberRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["editor", "contributor", "viewer"]),
});

/* ------------------------------------------------------------------- review */

export const reviewSchema = z
  .object({
    momentId: z.uuid(),
    decision: z.enum(["publish", "request_changes", "decline"]),
    note: optionalText(1000),
  })
  .superRefine((v, ctx) => {
    if (v.decision === "request_changes" && !v.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Say what you'd like changed, so they know what to do next.",
      });
    }
  });

/* --------------------------------------------------------------------- auth */

export const signInSchema = z.object({
  email: z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.email("Enter your email address.")),
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  displayName: trimmed(80).min(1, "Enter your name."),
  email: z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.email("Enter your email address.")),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(128, "Use 128 characters or fewer."),
});

/* ------------------------------------------------------------ form plumbing */

export type FieldErrors = Partial<Record<string, string>>;

export type FormState =
  | { status: "idle" }
  | { status: "error"; message?: string; fieldErrors: FieldErrors; values?: Record<string, string> }
  | { status: "success"; message: string };

export const idle: FormState = { status: "idle" };

/** Reads a FormData into a plain object, keeping repeated keys as arrays. */
export function formToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (typeof value !== "string") continue;
    const existing = out[key];
    if (existing === undefined) out[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else out[key] = [existing, value];
  }
  return out;
}

export function echoValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION") && key !== "password") out[key] = value;
  }
  return out;
}

export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): { ok: true; data: z.output<S> } | { ok: false; state: FormState } {
  const result = schema.safeParse(formToObject(formData));
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    ok: false,
    state: {
      status: "error",
      message: "Some details need attention.",
      fieldErrors,
      values: echoValues(formData),
    },
  };
}
