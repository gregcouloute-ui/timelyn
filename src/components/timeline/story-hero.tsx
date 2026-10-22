import Image from "next/image";
import { formatPartialDate, lifeSpan } from "@/lib/domain/dates";
import type { Story } from "@/lib/domain/types";
import { familiarName } from "@/lib/domain/names";
import { HeroLine, HeroPhoto } from "./hero-reveal";

export function StoryHero({ story, coverUrl }: { story: Story; coverUrl: string | null }) {
  const name = familiarName(story.subjectName, story.knownAs);
  const born = `Born ${formatPartialDate(story.birthDate)}${story.birthPlace ? ` in ${story.birthPlace}` : ""}.`;
  const died = story.deathDate
    ? ` Died ${formatPartialDate(story.deathDate)}${story.deathPlace ? ` in ${story.deathPlace}` : ""}.`
    : "";

  return (
    <section className="grain relative overflow-hidden bg-night text-night-ink" aria-labelledby="story-name">
      {coverUrl ? (
        <HeroPhoto>
          <Image
            src={coverUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            unoptimized={!coverUrl.startsWith("/demo/")}
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/50 to-night/10" />
        </HeroPhoto>
      ) : null}
      <div className="relative z-[2] mx-auto flex min-h-[min(78vh,46rem)] max-w-[90rem] flex-col justify-end px-4 pb-14 pt-28 sm:px-8 lg:pb-20">
        <div className="lg:pl-[16.5rem]">
          {story.knownAs ? (
            <HeroLine>
              <p className="text-ui text-night-soft">{story.subjectName}</p>
            </HeroLine>
          ) : null}
          <HeroLine delay={0.1}>
            <h1
              id="story-name"
              className="mt-2 text-[clamp(3.25rem,9vw,8.5rem)] font-light leading-[0.92] tracking-[-0.025em]"
              style={{ fontVariationSettings: '"opsz" 72' }}
            >
              {name}
            </h1>
          </HeroLine>
          <HeroLine delay={0.25} className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p
              className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-light numerals-oldstyle"
              style={{ fontVariationSettings: '"opsz" 48' }}
              aria-label={story.deathDate ? `${story.birthDate.year} to ${story.deathDate.year}` : `Born ${story.birthDate.year}`}
            >
              {lifeSpan(story.birthDate, story.deathDate)}
            </p>
            <p className="max-w-xl text-ui text-night-soft">
              {born}
              {died}
            </p>
          </HeroLine>
        </div>
      </div>
    </section>
  );
}
