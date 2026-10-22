import type { Metadata } from "next";
import Link from "next/link";
import { ChapterNav } from "@/components/timeline/chapter-nav";
import { StoryHero } from "@/components/timeline/story-hero";
import { Timeline } from "@/components/timeline/timeline";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ageAt, formatPartialDate, todayAsPartialDate } from "@/lib/domain/dates";
import { familiarName, shortName } from "@/lib/domain/names";
import { atLeast, can } from "@/lib/domain/permissions";
import type { Moment } from "@/lib/domain/types";
import { loadTimeline } from "@/lib/services/moments";
import { loadStoryPage } from "@/lib/story-page";
import { listJoin } from "@/lib/text";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { story } = await loadStoryPage(slug);
  return { title: familiarName(story.subjectName, story.knownAs) };
}

function contributorsLine(moments: Moment[], subjectFirst: string) {
  const names = new Map<string, string>();
  let ownWords = false;
  for (const m of moments) {
    if (m.contributorRelationship && /^(herself|himself|themself)$/i.test(m.contributorRelationship)) ownWords = true;
    else names.set(m.contributorId, m.contributorName.split(" ")[0]);
  }
  const list = [...names.values()];
  if (ownWords) list.push(`${subjectFirst} in their own words`);
  return list.length ? `Gathered by ${listJoin(list)}.` : null;
}

export default async function StoryPage({ params, searchParams }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const { story, role, viewer, repo } = await loadStoryPage(slug);
  const access = { story, role };
  const [{ chapters, published, mine, awaitingReview }, cover] = await Promise.all([
    loadTimeline(repo, access, viewer),
    story.coverMediaId ? repo.getMedia([story.coverMediaId]).then((m) => m[0] ?? null) : Promise.resolve(null),
  ]);

  const first = shortName(story.subjectName, story.knownAs);
  const base = `/s/${story.slug}`;
  const canAdd = atLeast(role, "contributor");
  const years = (story.deathDate ?? todayAsPartialDate()).year - story.birthDate.year;
  const gathered = contributorsLine(published, first);

  const navChapters = chapters.map((c) => ({
    id: c.chapter.id,
    title: c.chapter.title,
    years: c.endYear ? `${c.chapter.startYear}–${String(c.endYear).slice(-2)}` : `${c.chapter.startYear}`,
  }));

  const nowAge = story.deathDate ? null : ageAt(story.birthDate, todayAsPartialDate());
  const ending = story.deathDate ? (
    <div className="max-w-xl">
      <p className="text-small text-ink-soft numerals-oldstyle">{formatPartialDate(story.deathDate)}</p>
      <p className="mt-1.5 font-serif text-h3">
        {first} died{story.deathPlace ? ` in ${story.deathPlace}` : ""}, and is remembered here by the people who loved them.
      </p>
      {canAdd ? (
        <p className="mt-4 text-ui text-ink-soft">
          There&rsquo;s always more to remember. <Link href={`${base}/add`} className="link">Add a moment</Link>
        </p>
      ) : null}
    </div>
  ) : (
    <div className="max-w-xl">
      <p className="text-small text-ink-soft">Today</p>
      <p className="mt-1.5 font-serif text-h3">
        {first}&rsquo;s story is still being written{nowAge ? `, at ${nowAge.years}` : ""}.
      </p>
      {canAdd ? (
        <p className="mt-4 text-ui text-ink-soft">
          Something worth keeping happened recently? <Link href={`${base}/add`} className="link">Add a moment</Link>
        </p>
      ) : null}
    </div>
  );

  return (
    <main id="main">
      <StoryHero story={story} coverUrl={cover?.url ?? null} />

      <section className="mx-auto max-w-[90rem] px-4 py-14 sm:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16 lg:pl-[16.5rem]">
          <div>
            <Notice value={query.notice} className="mb-8" />
            {story.introduction ? (
              <p className="max-w-[34em] font-serif text-lede text-ink" style={{ fontVariationSettings: '"opsz" 28' }}>
                {story.introduction}
              </p>
            ) : can.editStory(role) ? (
              <p className="max-w-[34em] text-body text-ink-soft">
                Add a few words to open {first}&rsquo;s story in{" "}
                <Link href={`${base}/settings`} className="link">settings</Link>.
              </p>
            ) : null}
          </div>
          <aside className="flex flex-col gap-4 text-ui text-ink-soft lg:border-l lg:border-rule lg:pl-8">
            <p>
              <span className="text-ink">{published.length === 1 ? "One moment" : `${published.length} moments`}</span> across{" "}
              {years === 1 ? "one year" : `${years} years`}.
              {gathered ? ` ${gathered}` : ""}
            </p>
            {awaitingReview > 0 ? (
              <p className="flex items-start gap-2.5 text-ink">
                <span aria-hidden="true" className="mt-[0.45rem] size-1.5 shrink-0 rotate-45 bg-gold" />
                <span>
                  {awaitingReview === 1 ? "One contribution is" : `${awaitingReview} contributions are`} waiting for you.{" "}
                  <Link href={`${base}/review`} className="link">Review</Link>
                </span>
              </p>
            ) : null}
            {mine.length > 0 && !can.review(role) ? (
              <p>
                You have {mine.length === 1 ? "one contribution" : `${mine.length} contributions`} with the story keeper.{" "}
                <Link href={`${base}/mine`} className="link">See where they are</Link>
              </p>
            ) : null}
            {canAdd ? (
              <div>
                <ButtonLink href={`${base}/add`} variant="secondary" size="sm">
                  Add a moment
                </ButtonLink>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {published.length === 0 ? (
        <section className="mx-auto max-w-[90rem] px-4 pb-28 sm:px-8">
          <div className="border-t border-rule pt-14 lg:pl-[16.5rem]">
            <p className="font-serif text-year font-light text-ink-faint numerals-oldstyle" style={{ fontVariationSettings: '"opsz" 72' }}>
              {story.birthDate.year}
            </p>
            <h2 className="mt-6 text-h2">{first}&rsquo;s story begins here</h2>
            <p className="mt-3 max-w-xl text-body text-ink-soft">
              {canAdd
                ? "Start with something you know well: the day they were born, a photograph you love, or a story you've heard many times."
                : "Nothing has been published yet. When the story keeper approves the first moments, they'll appear here."}
            </p>
            {canAdd ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={`${base}/add`}>Add the first moment</ButtonLink>
                {can.inviteMembers(role) ? (
                  <ButtonLink href={`${base}/people`} variant="secondary">
                    Invite family
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <>
          <ChapterNav chapters={navChapters} />
          <Timeline story={story} chapters={chapters} linkFor={(m) => `${base}/m/${m.id}`} ending={ending} />
        </>
      )}
    </main>
  );
}
