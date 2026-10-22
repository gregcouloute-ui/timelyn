/** Splits stored text into paragraphs on blank lines. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** A readable excerpt that ends on a sentence where possible. */
export function excerpt(text: string, max = 420): { text: string; truncated: boolean } {
  const clean = text.trim();
  if (clean.length <= max) return { text: clean, truncated: false };
  const slice = clean.slice(0, max);
  const sentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (sentenceEnd > max * 0.5) return { text: slice.slice(0, sentenceEnd + 1), truncated: true };
  return { text: `${slice.slice(0, slice.lastIndexOf(" "))}…`, truncated: true };
}

/** "Jean", "Jean and Alan", "Jean, Alan and Dad". */
export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function lowerFirst(s: string) {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}
