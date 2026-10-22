import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { formatPartialDate } from "@/lib/domain/dates";
import { atLeast } from "@/lib/domain/permissions";
import type { Moment, MomentStatus } from "@/lib/domain/types";
import { loadStoryPage } from "@/lib/story-page";

export const metadata: Metadata = { title: "Your contributions" };

const GROUPS: { status: MomentStatus; title: string; empty?: string; tone: string }[] = [
  { status: "changes_requested", title: "Needs your attention", tone: "bg-sun" },
  { status: "pending", title: "Waiting for review", tone: "bg-pop" },
  { status: "published", title: "In the story", tone: "bg-mint" },
  { status: "declined", title: "Not included", tone: "bg-paper" },
];

function Row({ m, slug }: { m: Moment; slug: string }) {
  return (
    <li className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-8">
      <div>
        <Link href={`/s/${slug}/m/${m.id}`} className="text-h3 font-bold text-ink hover:bg-pop">
          {m.title}
        </Link>
        <p className="mt-1 text-small text-ink-soft">
          {formatPartialDate(m.date)}
          {m.media.length ? `, with ${m.media.length} ${m.media.length === 1 ? "file" : "files"}` : ""}
        </p>
        {m.reviewNote && m.status !== "published" ? (
          <p className="mt-3 max-w-xl text-body font-medium text-ink">&ldquo;{m.reviewNote}&rdquo;</p>
        ) : null}
      </div>
      {m.status === "changes_requested" || m.status === "pending" ? (
        <ButtonLink href={`/s/${slug}/m/${m.id}/edit`} variant={m.status === "changes_requested" ? "primary" : "secondary"} size="sm">
          {m.status === "changes_requested" ? "Make changes" : "Edit"}
        </ButtonLink>
      ) : null}
    </li>
  );
}

export default async function MinePage({ params, searchParams }: PageProps<"/s/[slug]/mine">) {
  const { slug } = await params;
  const query = await searchParams;
  const { story, role, viewer, repo } = await loadStoryPage(slug);
  const mine = atLeast(role, "contributor") ? await repo.listMoments(story.id, { contributorId: viewer.id }) : [];

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Notice value={query.notice} className="mb-8" />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-h1 uppercase">Your contributions</h1>
        {atLeast(role, "contributor") ? <ButtonLink href={`/s/${slug}/add`}>Add a moment</ButtonLink> : null}
      </div>
      {mine.length === 0 ? (
        <p className="mt-10 border-t-[3px] border-black pt-8 text-body text-ink-soft">
          You haven&rsquo;t added anything yet. Photographs, a story you&rsquo;ve been told, a recording of a voice: it
          all helps.
        </p>
      ) : (
        GROUPS.map((g) => {
          const items = mine.filter((m) => m.status === g.status);
          if (!items.length) return null;
          return (
            <section key={g.status} className="mt-12" aria-labelledby={`group-${g.status}`}>
              <h2 id={`group-${g.status}`} className={cn("tag font-sans text-ui", g.tone)}>
                {g.title} <span className="font-normal">{items.length}</span>
              </h2>
              <ul className="mt-2 divide-y-2 divide-black border-b-[3px] border-black">
                {items.map((m) => (
                  <Row key={m.id} m={m} slug={slug} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </main>
  );
}
