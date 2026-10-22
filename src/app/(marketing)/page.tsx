import Image from "next/image";
import Link from "next/link";
import { HeroLifeline } from "@/components/marketing/hero-lifeline";
import { AudioPlayer } from "@/components/timeline/audio-player";
import { HeroPhoto } from "@/components/timeline/hero-reveal";
import { MomentMarker } from "@/components/timeline/markers";
import { ButtonLink } from "@/components/ui/button";
import { exampleStory } from "@/lib/data/demo/example";
import { ageAt, formatAge, formatPartialDate } from "@/lib/domain/dates";

function ExcerptMoment({
  date,
  age,
  title,
  body,
  credit,
  milestone,
  children,
}: {
  date: string;
  age: string | null;
  title: string;
  body: string;
  credit: string;
  milestone?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative grid grid-cols-[4.5rem_minmax(0,1fr)] gap-6 pb-12 last:pb-0">
      <div className="pt-0.5 text-right">
        <p className="font-serif text-h3 font-light leading-none numerals-oldstyle">{date.slice(-4)}</p>
        {age ? <p className="mt-1.5 text-caption text-ink-soft">{age}</p> : null}
      </div>
      <div className="relative border-l border-rule-strong pl-6">
        <span className="absolute -left-px top-1.5 -translate-x-1/2">
          <MomentMarker milestone={milestone} filled={Boolean(children)} />
        </span>
        <p className="text-small text-ink-soft">{date}</p>
        <h3 className={milestone ? "mt-1 text-[1.75rem] leading-tight" : "mt-1 text-h3"}>{title}</h3>
        {children ? <div className="mt-4">{children}</div> : null}
        <p className="prose-story mt-3 text-body">{body}</p>
        <p className="mt-2.5 text-small text-ink-faint">{credit}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { story, moments } = exampleStory();
  const pick = (title: string) => moments.find((m) => m.title === title)!;
  const sandsend = pick("A day at Sandsend");
  const wedding = pick("Wedding at St Michael's");
  const sound = pick("The sound of Sandsend");
  const age = (d: (typeof moments)[number]["date"]) => formatAge(ageAt(story.birthDate, d));

  return (
    <main id="main">
      {/* Hero */}
      <section className="grain relative -mt-px overflow-hidden bg-night text-night-ink">
        <HeroPhoto>
          <Image src="/demo/cover-dawn.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/30 to-night" />
        </HeroPhoto>
        <div className="relative z-[2] mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-[90rem] flex-col justify-between px-4 pb-10 pt-20 sm:px-8 lg:pt-28">
          <div className="max-w-4xl">
            <h1
              className="text-[clamp(3rem,7.5vw,7rem)] font-light leading-[0.98] tracking-[-0.025em]"
              style={{ fontVariationSettings: '"opsz" 72' }}
            >
              Every life is a story worth keeping.
            </h1>
            <p className="mt-8 max-w-[34rem] text-lede leading-relaxed text-night-soft">
              Everline gathers a family&rsquo;s photographs, memories and voices into one life story, told in order
              from the day someone was born. Kept privately, by the people who knew them best.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <ButtonLink href="/sign-up" variant="onNight">
                Start a story
              </ButtonLink>
              <Link href="/example" className="text-ui text-night-ink underline decoration-night-soft/50 underline-offset-[0.3em] hover:decoration-night-ink">
                Read Peggy&rsquo;s story, an example
              </Link>
            </div>
          </div>
          <div className="mt-20 px-12 sm:px-16">
            <HeroLifeline />
          </div>
        </div>
      </section>

      {/* A life, in order */}
      <section className="mx-auto max-w-[90rem] px-4 py-24 sm:px-8 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24">
          <div className="lg:sticky lg:top-12 lg:self-start">
            <h2 className="text-[clamp(2.25rem,3.5vw,3.25rem)] leading-[1.08]">Not a photo album. A life, in order.</h2>
            <div className="mt-8 flex max-w-[30rem] flex-col gap-5 text-body text-ink-soft">
              <p>
                Photographs scattered across phones and shoeboxes lose their story. Everline puts each one back in its
                place: the year it happened, how old they were, who was there and who remembers it.
              </p>
              <p>
                Stories are divided into chapters of life, so a childhood in Whitby and forty years in Leeds each read
                as what they were. Dates can be exact, or simply &ldquo;around 1962&rdquo;.
              </p>
              <p>
                Voices matter too. Record a grandmother telling it herself, or the sound of the beach she walked as a
                girl.
              </p>
            </div>
          </div>

          <div className="rounded-soft bg-paper-raised p-6 sm:p-10">
            <p className="mb-8 text-small text-ink-soft">From Peggy Ellison&rsquo;s story. The family is fictional.</p>
            <ExcerptMoment
              date={formatPartialDate(sandsend.date)}
              age={age(sandsend.date)}
              title={sandsend.title}
              body="Every summer Dad shut the shop for one Saturday and we walked the beach to Sandsend and back."
              credit="In Peggy's own words"
            >
              <Image src="/demo/sandsend-1959.jpg" alt="Low tide at Sandsend, 1959" width={1600} height={1067} sizes="(min-width: 1024px) 36rem, 90vw" className="h-auto w-full rounded-frame" />
            </ExcerptMoment>
            <ExcerptMoment
              date={formatPartialDate(wedding.date)}
              age={age(wedding.date)}
              title={wedding.title}
              body="It rained from start to finish and nobody minded. Mum made her own dress from a pattern in Woman's Own."
              credit="Shared by Ruth Ellison, daughter"
              milestone
            />
            <ExcerptMoment
              date={formatPartialDate(sound.date)}
              age={age(sound.date)}
              title={sound.title}
              body="Gran's knee was too bad for the walk, so I went on my own and recorded the sea for her."
              credit="Shared by Tom Ellison, grandson"
            >
              <AudioPlayer src="/demo/sandsend-waves.wav" title="The sound of Sandsend" duration={22} />
            </ExcerptMoment>
          </div>
        </div>
      </section>

      {/* How a story grows */}
      <section className="border-y border-rule bg-paper-sunk">
        <div className="mx-auto max-w-[90rem] px-4 py-24 sm:px-8 lg:py-28">
          <h2 className="max-w-2xl text-[clamp(2rem,3vw,2.75rem)] leading-[1.1]">How a story grows</h2>
          <ol className="mt-14 grid gap-12 md:grid-cols-4 md:gap-8">
            {[
              ["Begin with a birth", "Enter their name and when they were born. The lifeline starts there, and every moment finds its place along it."],
              ["Invite the family", "Send a private link to the people who knew them. Each person can add, or simply read, as you choose."],
              ["Approve what arrives", "Contributions wait for you, the story keeper. Publish them, ask a question, or politely leave one out."],
              ["Keep it for good", "The story is private to its members and grows for as long as you like, whether or not they are still with you."],
            ].map(([title, body], i) => (
              <li key={title} className="relative border-t-2 border-ink pt-6">
                <span className="font-serif text-h2 font-light text-ink-faint numerals-oldstyle">{i + 1}</span>
                <h3 className="mt-3 text-h3">{title}</h3>
                <p className="mt-3 text-body text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Living and remembered */}
      <section className="mx-auto max-w-[90rem] px-4 py-24 sm:px-8 lg:py-32">
        <h2 className="max-w-3xl text-[clamp(2rem,3vw,2.75rem)] leading-[1.1]">For the people still here, and the people we miss.</h2>
        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-10">
          {[
            {
              img: "/demo/garden-2014.jpg",
              name: "Peggy, 1951 –",
              text: "Start a story with someone while they can tell it themselves. Sit down with your mother, record her voice, and let the grandchildren ask their questions.",
            },
            {
              img: "/demo/walter-workshop-1985.jpg",
              name: "Walt, 1946 – 2019",
              text: "Or gather what a family remembers of someone who has gone: the workshop, the fiddle, the arguments, the walks along the canal.",
            },
          ].map((c) => (
            <figure key={c.name}>
              <div className="relative aspect-[3/2] overflow-hidden rounded-frame bg-night">
                <Image src={c.img} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="mt-5">
                <p className="font-serif text-h3 numerals-oldstyle">{c.name}</p>
                <p className="mt-2 max-w-md text-body text-ink-soft">{c.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Private by design */}
      <section className="bg-night text-night-ink">
        <div className="mx-auto grid max-w-[90rem] gap-12 px-4 py-24 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24 lg:py-28">
          <h2 className="text-[clamp(2rem,3vw,2.75rem)] leading-[1.1]">Private by design, because families are.</h2>
          <div className="grid gap-10 sm:grid-cols-2">
            {[
              ["Only the people you invite", "There is no public profile and no search listing. A story is visible to its members and nobody else."],
              ["Nothing appears unapproved", "Every contribution waits for the story keeper, so the story reads the way the family wants it to."],
              ["Each family keeps its own", "Photographs and recordings are stored privately and shown only through short-lived links to members."],
              ["Books and keepsakes, later", "Printed life-story books and photo albums are in preparation. Everything you gather now will be ready for them."],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-sans text-ui font-semibold">{title}</h3>
                <p className="mt-2 text-ui text-night-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-4 py-24 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <h2 className="text-[clamp(2.25rem,3.5vw,3.25rem)] leading-[1.08]">Whose story will you start?</h2>
          <p className="mt-5 text-body text-ink-soft">It takes a minute to begin, and a lifetime to finish.</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <ButtonLink href="/sign-up">Start a story</ButtonLink>
            <Link href="/example" className="link text-ui">See an example first</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
