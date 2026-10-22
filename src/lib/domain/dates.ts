import type { PartialDate } from "./types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? "";
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidPartialDate(d: PartialDate): boolean {
  if (!Number.isInteger(d.year) || d.year < 1800 || d.year > 2200) return false;
  if (d.month === null) return d.day === null;
  if (!Number.isInteger(d.month) || d.month < 1 || d.month > 12) return false;
  if (d.day === null) return true;
  return Number.isInteger(d.day) && d.day >= 1 && d.day <= daysInMonth(d.year, d.month);
}

/** A sortable number: unknown parts sort to the start of their period. */
export function sortKey(d: PartialDate): number {
  return d.year * 10000 + (d.month ?? 0) * 100 + (d.day ?? 0);
}

export function compareDates(a: PartialDate, b: PartialDate): number {
  return sortKey(a) - sortKey(b);
}

/**
 * British-style long date, honest about uncertainty.
 *   { 1974, 6, 22 }       → "22 June 1974"
 *   { 1974, 6, null }     → "June 1974"
 *   { 1962, null, circa } → "around 1962"
 */
export function formatPartialDate(d: PartialDate): string {
  let text: string;
  if (d.month && d.day) text = `${d.day} ${monthName(d.month)} ${d.year}`;
  else if (d.month) text = `${monthName(d.month)} ${d.year}`;
  else text = String(d.year);
  return d.circa ? `around ${text}` : text;
}

/** Short form for tight spaces: "Jun 1974", "c. 1962". */
export function formatPartialDateShort(d: PartialDate): string {
  const prefix = d.circa ? "c. " : "";
  if (d.month) return `${prefix}${monthName(d.month).slice(0, 3)} ${d.year}`;
  return `${prefix}${d.year}`;
}

/**
 * Age at a given date. When precision is missing we return the age the person
 * most likely was, and flag it as approximate.
 */
export function ageAt(
  birth: PartialDate,
  at: PartialDate,
): { years: number; approximate: boolean } | null {
  if (sortKey(at) < sortKey(birth)) return null;
  let years = at.year - birth.year;
  let approximate = birth.circa || at.circa;
  if (birth.month && at.month) {
    const beforeBirthday =
      at.month < birth.month ||
      (at.month === birth.month && birth.day !== null && at.day !== null && at.day < birth.day);
    if (beforeBirthday) years -= 1;
    if (at.month === birth.month && (birth.day === null || at.day === null)) approximate = true;
  } else if (years > 0) {
    approximate = true;
  }
  return { years: Math.max(0, years), approximate };
}

export function formatAge(age: { years: number; approximate: boolean } | null): string | null {
  if (!age) return null;
  if (age.years === 0) return "In the first year";
  const base = `Aged ${age.years}`;
  return age.approximate ? `${base} or so` : base;
}

/** "1951 –" for the living, "1946 – 2019" for those remembered. */
export function lifeSpan(birth: PartialDate, death: PartialDate | null): string {
  return death ? `${birth.year} – ${death.year}` : `${birth.year} –`;
}

export function todayAsPartialDate(now = new Date()): PartialDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), circa: false };
}

export function isInFuture(d: PartialDate, now = new Date()): boolean {
  return sortKey(d) > sortKey(todayAsPartialDate(now));
}
