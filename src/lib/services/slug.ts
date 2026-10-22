export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** "Margaret Ellison" known as "Peggy" → "peggy-ellison". */
export function storySlugBase(subjectName: string, knownAs: string | null): string {
  const parts = subjectName.trim().split(/\s+/);
  const surname = parts.length > 1 ? parts[parts.length - 1] : "";
  const base = knownAs ? `${knownAs} ${surname}` : subjectName;
  const slug = slugify(base);
  return slug.length >= 3 ? slug : `${slug || "story"}-life`.slice(0, 60);
}
