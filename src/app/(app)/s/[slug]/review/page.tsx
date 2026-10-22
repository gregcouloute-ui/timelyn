import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReviewList } from "@/components/moments/review-list";
import { formatPartialDate } from "@/lib/domain/dates";
import { shortName } from "@/lib/domain/names";
import { can } from "@/lib/domain/permissions";
import { reviewQueue } from "@/lib/services/moments";
import { loadStoryPage } from "@/lib/story-page";
import { reviewAction } from "../actions";

export const metadata: Metadata = { title: "Review contributions" };

export default async function ReviewPage({ params }: PageProps<"/s/[slug]/review">) {
  const { slug } = await params;
  const { story, role, repo } = await loadStoryPage(slug);
  if (!can.review(role)) redirect(`/s/${slug}`);
  const { pending, returned } = await reviewQueue(repo, { story, role });
  const first = shortName(story.subjectName, story.knownAs);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-h1">Review</h1>
      <p className="mt-4 max-w-2xl text-body text-ink-soft">
        Nothing appears in {first}&rsquo;s story until you or another editor publishes it. If something needs a date
        checked or a name added, send it back with a note.
      </p>

      <section className="mt-12" aria-labelledby="waiting">
        <h2 id="waiting" className="text-h3">
          Waiting for review <span className="text-ink-faint numerals-oldstyle">{pending.length}</span>
        </h2>
        {pending.length ? (
          <div className="mt-4">
            <ReviewList moments={pending} action={reviewAction.bind(null, slug)} />
          </div>
        ) : (
          <p className="mt-4 border-t border-rule pt-6 text-body text-ink-soft">
            You&rsquo;re up to date. New contributions will appear here.
          </p>
        )}
      </section>

      {returned.length ? (
        <section className="mt-16" aria-labelledby="returned">
          <h2 id="returned" className="text-h3">Sent back for changes</h2>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {returned.map((m) => (
              <li key={m.id} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
                <div>
                  <Link href={`/s/${slug}/m/${m.id}`} className="font-serif text-body text-ink hover:text-cyan">
                    {m.title}
                  </Link>
                  <p className="text-small text-ink-soft">
                    {m.contributorName}, {formatPartialDate(m.date)}. Your note: &ldquo;{m.reviewNote}&rdquo;
                  </p>
                </div>
                <span className="text-small text-ink-faint">With {m.contributorName.split(" ")[0]}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
