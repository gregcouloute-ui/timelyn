/** "Peggy Ellison" from "Margaret Ellison" known as "Peggy". */
export function familiarName(subjectName: string, knownAs: string | null) {
  if (!knownAs) return subjectName;
  const parts = subjectName.trim().split(/\s+/);
  return parts.length > 1 ? `${knownAs} ${parts[parts.length - 1]}` : knownAs;
}

/** First name for warm, short references: "Peggy". */
export function shortName(subjectName: string, knownAs: string | null) {
  return knownAs ?? subjectName.trim().split(/\s+/)[0];
}
