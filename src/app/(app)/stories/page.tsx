import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { getRepository, requireViewer } from "@/lib/auth/session";
import { lifeSpan } from "@/lib/domain/dates";
import { ROLE_LABEL } from "@/lib/domain/permissions";
import { familiarName } from "@/lib/domain/names";
import type { StorySummary } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Your stories" };

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function StoryRow({ story }: { story: StorySummary }) {
  const name = familiarName(story.subjectName, story.knownAs);
  const canReview = story.role === "owner" || story.role === "editor";
  return (
    <li>
      <Link
        href={`/s/${story.slug}`}
        className="group grid gap-5 py-8 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-10"
      >
        <div className="relative aspect-[3/2] overflow-hidden rounded-frame bg-night">
          {story.coverUrl ? (
            <Image
              src={story.coverUrl}
              alt=""
              fill
              sizes="(min-width: 640px) 18rem, 100vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease-develop)] group-hover:scale-[1.02]"
              unoptimized={!story.coverUrl.startsWith("/demo/")}
            />
          ) : (
            <div className="flex h-full items-end p-5">
              <span className="font-serif text-h2 text-night-ink/80 numerals-oldstyle">{story.birthDate.year}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-h2 group-hover:text-cyan">{name}</h2>
          <p className="mt-1.5 text-body text-ink-soft">
            {story.knownAs ? `${story.subjectName}, ` : ""}
            <span className="numerals-oldstyle">{lifeSpan(story.birthDate, story.deathDate)}</span>
          </p>
          <p className="mt-4 text-ui text-ink-soft">
            {ROLE_LABEL[story.role]}. {plural(story.publishedCount, "moment", "moments")}, {plural(story.memberCount, "person", "people")} taking part.
          </p>
          {canReview && story.awaitingReviewCount > 0 ? (
            <p className="mt-2 inline-flex items-center gap-2 text-ui font-medium text-gold">
              <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold" />
              {plural(story.awaitingReviewCount, "contribution", "contributions")} waiting for your review
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

export default async function StoriesPage({ searchParams }: PageProps<"/stories">) {
  const viewer = await requireViewer("/stories");
  const repo = await getRepository();
  const [stories, params] = await Promise.all([repo.listStoriesForUser(viewer.id), searchParams]);

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-12 sm:px-8 sm:pt-16">
      <Notice value={params.notice} className="mb-8" />
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-8">
        <div>
          <h1 className="text-h1">Your stories</h1>
          <p className="mt-3 max-w-xl text-body text-ink-soft">
            {stories.length
              ? "The lives you're helping to keep."
              : "Start with one person. Their story begins on the day they were born."}
          </p>
        </div>
        {stories.length ? <ButtonLink href="/stories/new">Start a new story</ButtonLink> : null}
      </div>

      {stories.length ? (
        <ul className="divide-y divide-rule">
          {stories.map((s) => (
            <StoryRow key={s.id} story={s} />
          ))}
        </ul>
      ) : (
        <section className="grid gap-10 py-14 sm:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-h3">Who would you like to remember?</h2>
            <p className="mt-3 text-body text-ink-soft">
              A parent, a grandparent, a friend, or yourself. You&rsquo;ll be the story keeper: you invite family,
              and you decide what appears.
            </p>
            <ButtonLink href="/stories/new" className="mt-6">
              Start a story
            </ButtonLink>
          </div>
          <div className="border-l border-rule pl-8 text-body text-ink-soft">
            <p>Been invited by someone in your family?</p>
            <p className="mt-2">
              Open the link they sent you while signed in as {viewer.email ?? "this account"}, and their story will
              appear here.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
