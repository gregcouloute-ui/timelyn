import type { Metadata } from "next";
import { ChapterNav } from "@/components/timeline/chapter-nav";
import { StoryHero } from "@/components/timeline/story-hero";
import { Timeline } from "@/components/timeline/timeline";
import { ButtonLink } from "@/components/ui/button";
import { exampleStory } from "@/lib/data/demo/example";
import { arrangeTimeline } from "@/lib/services/moments";

export const metadata: Metadata = {
  title: "An example story",
  description: "Peggy Ellison's life story, an example of TimeLyn with a fictional family.",
};

export default function ExamplePage() {
  const { story, moments, chapters, coverUrl } = exampleStory();
  const arranged = arrangeTimeline(chapters, moments);
  const nav = arranged.map((c) => ({
    id: c.chapter.id,
    title: c.chapter.title,
    years: c.endYear ? `${c.chapter.startYear}–${String(c.endYear).slice(-2)}` : `${c.chapter.startYear}`,
  }));

  return (
    <main id="main">
      <div className="border-b-[length:var(--line)] border-black bg-black px-4 py-3 text-center text-small font-bold text-white sm:px-8">
        This is an example. The Ellison family, their stories and their photographs are fictional.
      </div>
      <StoryHero story={story} coverUrl={coverUrl} chapterCount={chapters.length} />
      <section className="mx-auto max-w-[90rem] px-4 py-14 sm:px-8 lg:py-20">
        <p className="max-w-[36em] text-lede font-medium">
          {story.introduction}
        </p>
      </section>
      <ChapterNav chapters={nav} />
      <Timeline
        story={story}
        chapters={arranged}
        linkFor={() => null}
        ending={
          <div className="brutal max-w-xl bg-sun p-6">
            <p className="tag bg-black text-white">Today</p>
            <p className="mt-3 font-display text-h3 display-case leading-tight">Peggy&rsquo;s story is still being written.</p>
            <p className="mt-3 text-body font-medium">Someone in your family has a story like this.</p>
            <ButtonLink href="/sign-up" className="mt-6">
              Start a story
            </ButtonLink>
          </div>
        }
      />
    </main>
  );
}
