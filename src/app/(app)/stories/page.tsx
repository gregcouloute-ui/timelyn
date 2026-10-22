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

const FILLS = ["bg-pop", "bg-mint", "bg-sun", "bg-coral", "bg-pink"] as const;

function StoryRow({ story, index }: { story: StorySummary; index: number }) {
  const name = familiarName(story.subjectName, story.knownAs);
  const canReview = story.role === "owner" || story.role === "editor";
  return (
    <li>
      <Link
        href={`/s/${story.slug}`}
        className="press group grid bg-paper sm:grid-cols-[minmax(0,17rem)_1fr]"
      >
        <div className="relative aspect-[3/2] border-b-[3px] border-black bg-black sm:aspect-auto sm:border-b-0 sm:border-r-[3px]">
          {story.coverUrl ? (
            <Image
              src={story.coverUrl}
              alt=""
              fill
              sizes="(min-width: 640px) 17rem, 100vw"
              className="object-cover"
              unoptimized={!story.coverUrl.startsWith("/demo/")}
            />
          ) : (
            <div className={`flex h-full min-h-40 items-end p-5 ${FILLS[index % FILLS.length]}`}>
              <span className="font-display text-h2">{story.birthDate.year}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
          <h2 className="text-h2 uppercase leading-none">{name}</h2>
          <p className="flex flex-wrap gap-2">
            <span className="tag bg-mint">{lifeSpan(story.birthDate, story.deathDate).replace("–", "to").replace(/to$/, "to today")}</span>
            <span className="tag">{ROLE_LABEL[story.role]}</span>
          </p>
          <p className="text-ui font-medium text-ink-soft">
            {plural(story.publishedCount, "moment", "moments")}, {plural(story.memberCount, "person", "people")} taking part.
          </p>
          {canReview && story.awaitingReviewCount > 0 ? (
            <p className="tag self-start bg-sun">
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
    <main id="main" className="dots flex-1"><div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-12 sm:px-8 sm:pt-16">
      <Notice value={params.notice} className="mb-8" />
      <div className="flex flex-wrap items-end justify-between gap-6 pb-10">
        <div>
          <h1 className="text-h1 uppercase">Your stories</h1>
          <p className="mt-3 max-w-xl text-body font-medium text-ink-soft">
            {stories.length
              ? "The lives you're helping to keep."
              : "Start with one person. Their story begins on the day they were born."}
          </p>
        </div>
        {stories.length ? <ButtonLink href="/stories/new">Start a new story</ButtonLink> : null}
      </div>

      {stories.length ? (
        <ul className="flex flex-col gap-8">
          {stories.map((s, i) => (
            <StoryRow key={s.id} story={s} index={i} />
          ))}
        </ul>
      ) : (
        <section className="grid gap-8 sm:grid-cols-[1fr_1fr]">
          <div className="brutal bg-sun p-6">
            <h2 className="text-h2 uppercase">Who would you like to remember?</h2>
            <p className="mt-3 text-body text-ink-soft">
              A parent, a grandparent, a friend, or yourself. You&rsquo;ll be the story keeper: you invite family,
              and you decide what appears.
            </p>
            <ButtonLink href="/stories/new" className="mt-6">
              Start a story
            </ButtonLink>
          </div>
          <div className="brutal p-6 text-body font-medium">
            <p>Been invited by someone in your family?</p>
            <p className="mt-2">
              Open the link they sent you while signed in as {viewer.email ?? "this account"}, and their story will
              appear here.
            </p>
          </div>
        </section>
      )}
      </div>
    </main>
  );
}
