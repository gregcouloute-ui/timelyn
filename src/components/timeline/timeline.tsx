import Link from "next/link";
import { cn } from "@/lib/cn";
import { ageAt, formatAge, formatPartialDate } from "@/lib/domain/dates";
import type { Moment, PartialDate, Story } from "@/lib/domain/types";
import type { TimelineChapter } from "@/lib/services/moments";
import { excerpt, lowerFirst, paragraphs } from "@/lib/text";
import { Lifeline } from "./lifeline";
import { MomentMarker, markerPosition } from "./markers";
import { MomentRecordings, TimelinePhotos } from "./moment-media";

type LinkFor = (moment: Moment) => string | null;

interface YearGroup {
  year: number;
  moments: Moment[];
}

/** Chapter fills cycle so neighbouring chapters never share a colour. */
const CHAPTER_FILLS = ["bg-pop", "bg-mint", "bg-coral", "bg-sun", "bg-pink", "bg-lime"] as const;

const GRID = "grid grid-cols-[2.25rem_minmax(0,1fr)] lg:grid-cols-[14rem_2.5rem_minmax(0,1fr)]";

function groupByYear(moments: Moment[]): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const m of moments) {
    const last = groups[groups.length - 1];
    if (last && last.year === m.date.year) last.moments.push(m);
    else groups.push({ year: m.date.year, moments: [m] });
  }
  return groups;
}

function ageForYear(birth: PartialDate, first: PartialDate, death: PartialDate | null) {
  if (first.year < birth.year) return `Before ${birth.year}`;
  if (death && first.year > death.year) return null;
  return formatAge(ageAt(birth, first));
}

export function attribution(m: Moment) {
  const rel = m.contributorRelationship;
  if (rel && /^(herself|himself|themself|themselves)$/i.test(rel)) return `In ${m.contributorName.split(" ")[0]}'s own words`;
  return rel ? `Shared by ${m.contributorName}, ${lowerFirst(rel)}` : `Shared by ${m.contributorName}`;
}

function MomentEntry({ moment, story, href }: { moment: Moment; story: Story; href: string | null }) {
  const images = moment.media.filter((m) => m.kind === "image");
  const body = moment.body ? excerpt(moment.body, images.length ? 320 : 520) : null;
  const age = formatAge(ageAt(story.birthDate, moment.date));

  return (
    <article id={`moment-${moment.id}`} className="relative scroll-mt-28" aria-labelledby={`moment-title-${moment.id}`}>
      <div className={markerPosition}>
        <MomentMarker milestone={moment.isMilestone} filled={images.length > 0} />
      </div>
      <div className={cn("brutal max-w-[46rem]", moment.isMilestone && "bg-sun")}>
        {images.length ? <TimelinePhotos images={images} href={href ?? "#"} title={moment.title} /> : null}
        <div className="p-5 sm:p-6">
          <p className="flex flex-wrap items-center gap-2 text-small font-medium text-ink-soft">
            <time className="tag numerals-tabular">{formatPartialDate(moment.date)}</time>
            {moment.isMilestone ? <span className="tag bg-black text-white">Milestone</span> : null}
            {moment.place ? <span>{moment.place}</span> : null}
            {age ? <span className="lg:hidden">{age}</span> : null}
          </p>
          <h3
            id={`moment-title-${moment.id}`}
            className={cn(
              "mt-3 max-w-[24em]",
              moment.isMilestone ? "font-display text-[clamp(1.6rem,2vw+1rem,2.25rem)] font-normal uppercase leading-[0.95]" : "text-h3",
            )}
          >
            {href ? (
              <Link href={href} className="hover:bg-pop">
                {moment.title}
              </Link>
            ) : (
              moment.title
            )}
          </h3>

          <MomentRecordings media={moment.media} title={moment.title} className="mt-4" />

          {body ? (
            <div className="prose-story mt-3">
              {paragraphs(body.text).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {body.truncated && href ? (
                <p>
                  <Link href={href} className="link text-ui">
                    Keep reading
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="mt-4 text-small font-medium text-ink-soft">{attribution(moment)}</p>
        </div>
      </div>
    </article>
  );
}

function ChapterHeader({ item, story, index }: { item: TimelineChapter; story: Story; index: number }) {
  const { chapter, endYear } = item;
  const end = endYear ?? story.deathDate?.year ?? null;
  const fill = CHAPTER_FILLS[index % CHAPTER_FILLS.length];
  return (
    <header className={GRID}>
      <div className="hidden lg:block" />
      <div className="relative">
        <span
          aria-hidden="true"
          className={cn("absolute left-[0.75rem] top-3 z-[1] block size-7 -translate-x-1/2 border-[3px] border-black lg:left-1/2", fill)}
        />
      </div>
      <div className="pb-6">
        <p className="tag bg-black text-white numerals-tabular">
          Chapter {index + 1}: {chapter.startYear}
          {end && end !== chapter.startYear ? ` to ${end}` : end ? "" : " onwards"}
        </p>
        <h2 id={`chapter-title-${chapter.id}`} className="mt-3 text-[clamp(2rem,3.5vw+1rem,3.5rem)] uppercase leading-[0.9]">
          <span className={cn("box-decoration-clone px-1", fill)}>{chapter.title}</span>
        </h2>
        {chapter.summary ? <p className="mt-4 max-w-[36em] text-lede font-medium text-ink-soft">{chapter.summary}</p> : null}
      </div>
    </header>
  );
}

export function Timeline({
  story,
  chapters,
  linkFor,
  ending,
}: {
  story: Story;
  chapters: TimelineChapter[];
  linkFor: LinkFor;
  ending?: React.ReactNode;
}) {
  return (
    <div className="dots">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
        <Lifeline>
          {chapters.map((item, index) => (
            <section
              key={item.chapter.id}
              id={`chapter-${item.chapter.id}`}
              aria-labelledby={`chapter-title-${item.chapter.id}`}
              className="scroll-mt-16 pt-20 first:pt-14"
            >
              <ChapterHeader item={item} story={story} index={index} />
              {item.moments.length === 0 ? (
                <div className={GRID}>
                  <div className="hidden lg:block" />
                  <div />
                  <p className="py-6 text-ui font-medium text-ink-soft">Nothing has been added to this chapter yet.</p>
                </div>
              ) : (
                groupByYear(item.moments).map((group) => {
                  const age = ageForYear(story.birthDate, group.moments[0].date, story.deathDate);
                  return (
                    <div key={group.year} className={GRID}>
                      <div className="hidden lg:block">
                        <div className="sticky top-20 pr-6 pt-5 text-right">
                          <p className="font-display text-year text-black numerals-tabular">{group.year}</p>
                          {age ? <p className="tag mt-2 bg-paper">{age}</p> : null}
                        </div>
                      </div>
                      <div />
                      <div className="flex flex-col gap-10 py-6">
                        <p aria-hidden="true" className="-mb-6 font-display text-[2.5rem] leading-none text-black lg:hidden">
                          {group.year}
                        </p>
                        {group.moments.map((m) => (
                          <MomentEntry key={m.id} moment={m} story={story} href={linkFor(m)} />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          ))}
          {ending ? (
            <div className={cn(GRID, "pb-28 pt-16")}>
              <div className="hidden lg:block" />
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute left-[0.75rem] top-3 z-[1] block size-7 -translate-x-1/2 border-[3px] border-black bg-sun lg:left-1/2"
                />
              </div>
              <div>{ending}</div>
            </div>
          ) : (
            <div className="pb-28" />
          )}
        </Lifeline>
      </div>
    </div>
  );
}
