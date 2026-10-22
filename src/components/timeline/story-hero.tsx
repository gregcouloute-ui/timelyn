import Image from "next/image";
import { formatPartialDate } from "@/lib/domain/dates";
import { shortName } from "@/lib/domain/names";
import type { Story } from "@/lib/domain/types";
import { HeroLine, HeroPhoto } from "./hero-reveal";

export function StoryHero({ story, coverUrl, chapterCount }: { story: Story; coverUrl: string | null; chapterCount?: number }) {
  const first = shortName(story.subjectName, story.knownAs);
  const surname = story.subjectName.trim().split(/\s+/).slice(-1)[0];

  return (
    <section className="border-b-[3px] border-black bg-pop" aria-labelledby="story-name">
      <div className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 lg:py-20">
        <div>
          <HeroLine>
            <p className="text-ui font-bold">
              {story.knownAs ? `${story.subjectName}, known as` : "The story of"}
            </p>
          </HeroLine>
          <HeroLine delay={0.08}>
            <h1 id="story-name" className="mt-2 text-[clamp(3.5rem,11vw,9rem)] uppercase leading-[0.85] tracking-[-0.03em]">
              {first}
              {story.knownAs && surname !== first ? (
                <span className="block text-[0.42em] leading-[1.1]">{surname}</span>
              ) : null}
            </h1>
          </HeroLine>
          <HeroLine delay={0.18} className="mt-6 flex flex-wrap gap-2">
            <span className="tag bg-mint">
              Born {formatPartialDate(story.birthDate)}
            </span>
            {story.birthPlace ? <span className="tag">{story.birthPlace}</span> : null}
            {story.deathDate ? (
              <span className="tag bg-black text-white">Died {formatPartialDate(story.deathDate)}</span>
            ) : null}
            {chapterCount ? <span className="tag">{chapterCount === 1 ? "1 chapter" : `${chapterCount} chapters`}</span> : null}
          </HeroLine>
        </div>
        {coverUrl ? (
          <HeroPhoto className="justify-self-center lg:justify-self-end">
            <div className="relative w-[min(22rem,80vw)] border-[3px] border-black bg-paper p-3 shadow-brutal-lg">
              <span aria-hidden="true" className="absolute -top-4 left-1/2 z-[1] h-7 w-24 -translate-x-1/2 -rotate-3 border-2 border-black bg-sun/90" />
              <div className="relative aspect-[4/3] border-[3px] border-black">
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  priority
                  sizes="22rem"
                  unoptimized={!coverUrl.startsWith("/demo/")}
                  className="object-cover"
                />
              </div>
            </div>
          </HeroPhoto>
        ) : null}
      </div>
    </section>
  );
}
