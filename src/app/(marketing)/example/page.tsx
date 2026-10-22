import type { Metadata } from "next";
import { ChapterNav } from "@/components/timeline/chapter-nav";
import { StoryHero } from "@/components/timeline/story-hero";
import { Timeline } from "@/components/timeline/timeline";
import { ButtonLink } from "@/components/ui/button";
import { exampleStory } from "@/lib/data/demo/example";
import { arrangeTimeline } from "@/lib/services/moments";

export const metadata: Metadata = {
  title: "An example story",
  description: "Peggy Ellison's life story, an example of Everline with a fictional family.",
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
      <div className="border-b border-night-soft/20 bg-night px-4 py-3 text-center text-small text-night-soft sm:px-8">
        This is an example. The Ellison family, their stories and their photographs are fictional.
      </div>
      <StoryHero story={story} coverUrl={coverUrl} />
      <section className="mx-auto max-w-[90rem] px-4 py-14 sm:px-8 lg:py-20">
        <p className="max-w-[34em] font-serif text-lede lg:ml-[16.5rem]" style={{ fontVariationSettings: '"opsz" 28' }}>
          {story.introduction}
        </p>
      </section>
      <ChapterNav chapters={nav} />
      <Timeline
        story={story}
        chapters={arranged}
        linkFor={() => null}
        ending={
          <div className="max-w-xl">
            <p className="text-small text-ink-soft">Today</p>
            <p className="mt-1.5 font-serif text-h3">Peggy&rsquo;s story is still being written.</p>
            <p className="mt-4 text-ui text-ink-soft">Someone in your family has a story like this.</p>
            <ButtonLink href="/sign-up" className="mt-6">
              Start a story
            </ButtonLink>
          </div>
        }
      />
    </main>
  );
}
