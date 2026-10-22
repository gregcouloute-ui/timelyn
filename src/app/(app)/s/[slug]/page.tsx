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
  const ending = (
    <div className={`brutal max-w-xl p-6 ${story.deathDate ? "bg-paper" : "bg-sun"}`}>
      <p className="tag bg-black text-white">{story.deathDate ? formatPartialDate(story.deathDate) : "Today"}</p>
      <p className="mt-3 font-display text-h3 uppercase leading-tight">
        {story.deathDate
          ? `${first} died${story.deathPlace ? ` in ${story.deathPlace}` : ""}, and is remembered here.`
          : `${first}'s story is still being written${nowAge ? `, at ${nowAge.years}` : ""}.`}
      </p>
      {canAdd ? (
        <ButtonLink href={`${base}/add`} className="mt-5">
          Add a moment
        </ButtonLink>
      ) : null}
    </div>
  );

  return (
    <main id="main">
      <StoryHero story={story} coverUrl={cover?.url ?? null} chapterCount={chapters.length} />

      <section className="mx-auto max-w-[90rem] px-4 py-12 sm:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div>
            <Notice value={query.notice} className="mb-8" />
            {story.introduction ? (
              <p className="max-w-[36em] text-lede font-medium text-ink">{story.introduction}</p>
            ) : can.editStory(role) ? (
              <p className="max-w-[36em] text-body text-ink-soft">
                Add a few words to open {first}&rsquo;s story in{" "}
                <Link href={`${base}/settings`} className="link">settings</Link>.
              </p>
            ) : null}
          </div>
          <aside className="brutal flex flex-col gap-4 p-5 text-ui">
            <p>
              <span className="font-display text-h3">{published.length}</span>{" "}
              <span className="font-bold">{published.length === 1 ? "moment" : "moments"}</span> across{" "}
              {years === 1 ? "one year" : `${years} years`}.
              {gathered ? ` ${gathered}` : ""}
            </p>
            {awaitingReview > 0 ? (
              <p className="border-2 border-black bg-sun px-3 py-2 font-medium">
                {awaitingReview === 1 ? "One contribution is" : `${awaitingReview} contributions are`} waiting for you.{" "}
                <Link href={`${base}/review`} className="font-bold underline decoration-2 underline-offset-2">Review</Link>
              </p>
            ) : null}
            {mine.length > 0 && !can.review(role) ? (
              <p className="border-2 border-black bg-mint px-3 py-2 font-medium">
                You have {mine.length === 1 ? "one contribution" : `${mine.length} contributions`} with the story keeper.{" "}
                <Link href={`${base}/mine`} className="font-bold underline decoration-2 underline-offset-2">See where they are</Link>
              </p>
            ) : null}
            {canAdd ? (
              <div>
                <ButtonLink href={`${base}/add`}>Add a moment</ButtonLink>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {published.length === 0 ? (
        <section className="mx-auto max-w-[90rem] px-4 pb-28 sm:px-8">
          <div className="brutal-lg bg-sun p-8 sm:p-10">
            <p className="tag bg-black text-white">{story.birthDate.year}</p>
            <h2 className="mt-4 text-h2 uppercase">{first}&rsquo;s story begins here</h2>
            <p className="mt-3 max-w-xl text-body font-medium">
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
