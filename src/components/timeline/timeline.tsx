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
  const Title = moment.isMilestone ? "text-[clamp(1.75rem,2.4vw+1rem,2.4rem)] leading-[1.1]" : "text-h3";

  return (
    <article id={`moment-${moment.id}`} className="relative scroll-mt-28" aria-labelledby={`moment-title-${moment.id}`}>
      <div className={markerPosition}>
        <MomentMarker milestone={moment.isMilestone} filled={images.length > 0} />
      </div>
      <p className="text-small text-ink-soft">
        <time className="numerals-oldstyle">{formatPartialDate(moment.date)}</time>
        {moment.place ? <span>, {moment.place}</span> : null}
        {age ? <span className="text-ink-faint lg:hidden"> ({lowerFirst(age)})</span> : null}
      </p>
      <h3 id={`moment-title-${moment.id}`} className={cn("mt-1.5 max-w-[24em]", Title)}>
        {moment.isMilestone ? <span className="sr-only">Milestone: </span> : null}
        {href ? (
          <Link href={href} className="decoration-rule-strong decoration-1 underline-offset-[0.2em] hover:underline">
            {moment.title}
          </Link>
        ) : (
          moment.title
        )}
      </h3>

      {images.length ? (
        <div className="mt-5 max-w-[52rem]">
          <TimelinePhotos images={images} href={href ?? "#"} title={moment.title} />
        </div>
      ) : null}

      <MomentRecordings media={moment.media} title={moment.title} className="mt-5 max-w-[52rem]" />

      {body ? (
        <div className="prose-story mt-4">
          {paragraphs(body.text).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {body.truncated && href ? (
            <p>
              <Link href={href} className="link font-sans text-ui">
                Continue reading
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-small text-ink-faint">{attribution(moment)}</p>
    </article>
  );
}

function ChapterHeader({ item, story }: { item: TimelineChapter; story: Story }) {
  const { chapter, endYear } = item;
  const end = endYear ?? story.deathDate?.year ?? null;
  return (
    <header className="grid grid-cols-[2.25rem_minmax(0,1fr)] lg:grid-cols-[14rem_2.5rem_minmax(0,1fr)]">
      <div className="hidden lg:block" />
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute left-[0.75rem] top-[1.1rem] block size-4 -translate-x-1/2 rounded-full border-2 border-ink bg-paper ring-4 ring-paper lg:left-1/2"
        />
      </div>
      <div className="pb-4">
        <p className="text-small text-ink-soft numerals-oldstyle">
          {chapter.startYear}
          {end && end !== chapter.startYear ? ` – ${end}` : end ? "" : " onwards"}
        </p>
        <h2 id={`chapter-title-${chapter.id}`} className="mt-1 text-h2">
          {chapter.title}
        </h2>
        {chapter.summary ? (
          <p className="mt-3 max-w-[34em] font-serif text-lede italic text-ink-soft" style={{ fontVariationSettings: '"opsz" 24' }}>
            {chapter.summary}
          </p>
        ) : null}
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
    <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
      <Lifeline>
        {chapters.map((item) => (
          <section
            key={item.chapter.id}
            id={`chapter-${item.chapter.id}`}
            aria-labelledby={`chapter-title-${item.chapter.id}`}
            className="scroll-mt-14 pt-20 first:pt-14"
          >
            <ChapterHeader item={item} story={story} />
            {item.moments.length === 0 ? (
              <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] lg:grid-cols-[14rem_2.5rem_minmax(0,1fr)]">
                <div className="hidden lg:block" />
                <div />
                <p className="py-6 text-ui text-ink-faint">Nothing has been added to this chapter yet.</p>
              </div>
            ) : (
              groupByYear(item.moments).map((group) => {
                const age = ageForYear(story.birthDate, group.moments[0].date, story.deathDate);
                return (
                  <div
                    key={group.year}
                    className="grid grid-cols-[2.25rem_minmax(0,1fr)] border-t border-transparent lg:grid-cols-[14rem_2.5rem_minmax(0,1fr)]"
                  >
                    <div className="hidden lg:block">
                      <div className="sticky top-16 pr-5 pt-7 text-right">
                        <p
                          className="font-serif text-year font-light text-ink numerals-oldstyle"
                          style={{ fontVariationSettings: '"opsz" 72' }}
                        >
                          {group.year}
                        </p>
                        {age ? <p className="mt-2 text-small text-ink-soft">{age}</p> : null}
                      </div>
                    </div>
                    <div />
                    <div className="flex flex-col gap-14 py-8">
                      <p
                        aria-hidden="true"
                        className="-mb-10 font-serif text-[2.75rem] font-light leading-none text-ink numerals-oldstyle lg:hidden"
                      >
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
          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] pb-28 pt-16 lg:grid-cols-[14rem_2.5rem_minmax(0,1fr)]">
            <div className="hidden lg:block" />
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute left-[0.75rem] top-[0.45rem] block size-3 -translate-x-1/2 rounded-full bg-cyan ring-4 ring-paper lg:left-1/2"
              />
            </div>
            <div>{ending}</div>
          </div>
        ) : (
          <div className="pb-28" />
        )}
      </Lifeline>
    </div>
  );
}
