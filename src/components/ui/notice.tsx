const MESSAGES = {
  "story-created": "Your story has begun. Add the first moment, or invite family to help.",
  "story-saved": "Story details saved.",
  "moment-sent": "Thank you. Your moment has been sent to the story keeper for review.",
  "moment-added": "Moment added to the story.",
  "moment-saved": "Changes saved.",
  "moment-resent": "Changes sent for review.",
  "moment-removed": "Moment removed.",
  "joined": "You've joined the story. Welcome.",
  "left": "You've left the story.",
  "story-deleted": "The story has been deleted.",
} as const;

export type NoticeKey = keyof typeof MESSAGES;

/** One-off confirmations passed through the URL after a redirect. */
export function Notice({ value, className }: { value: unknown; className?: string }) {
  if (typeof value !== "string" || !(value in MESSAGES)) return null;
  return (
    <div role="status" className={className}>
      <p className="border-[3px] border-black bg-mint px-4 py-3 text-ui font-medium text-black shadow-brutal-sm">{MESSAGES[value as NoticeKey]}</p>
    </div>
  );
}
