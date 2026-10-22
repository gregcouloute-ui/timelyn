import Image from "next/image";
import Link from "next/link";
import { HeroLifeline } from "@/components/marketing/hero-lifeline";
import { AudioPlayer } from "@/components/timeline/audio-player";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { exampleStory } from "@/lib/data/demo/example";
import { ageAt, formatAge, formatPartialDate } from "@/lib/domain/dates";

function ExcerptCard({
  date,
  age,
  title,
  body,
  credit,
  milestone,
  tilt,
  children,
}: {
  date: string;
  age: string | null;
  title: string;
  body: string;
  credit: string;
  milestone?: boolean;
  tilt?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className={cn("brutal", milestone && "bg-sun", tilt)}>
      {children}
      <div className="p-5">
        <p className="flex flex-wrap items-center gap-2 text-small font-medium">
          <span className="tag">{date}</span>
          {age ? <span>{age}</span> : null}
        </p>
        <h3 className={milestone ? "mt-3 font-display text-[1.75rem] font-normal display-case leading-[0.95]" : "mt-3 text-h3"}>{title}</h3>
        <p className="mt-2 text-body">{body}</p>
        <p className="mt-3 text-small font-medium text-ink-soft">{credit}</p>
      </div>
    </article>
  );
}

const STEPS = [
  ["Begin with a birth", "Enter their name and when they were born. The lifeline starts there, and every moment finds its place along it.", "bg-pop"],
  ["Invite the family", "Send a private link to the people who knew them. Each person can add, or simply read, as you choose.", "bg-mint"],
  ["Approve what arrives", "Contributions wait for you, the story keeper. Publish them, ask a question, or politely leave one out.", "bg-sun"],
  ["Keep it for good", "The story is private to its members and grows for as long as you like, whether or not they are still with you.", "bg-coral"],
] as const;

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
      <section className="border-b-[length:var(--line)] border-black bg-pop">
        <div className="mx-auto max-w-[90rem] px-4 pb-10 pt-14 sm:px-8 lg:pt-20">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <h1 className="text-[clamp(3rem,8.5vw,8rem)] display-case leading-[0.86] tracking-[-0.035em]">
                Every life is a story worth keeping.
              </h1>
              <p className="mt-8 max-w-[34rem] text-lede font-medium">
                TimeLyn gathers a family&rsquo;s photos, memories and voices into one life story, in order from the day
                someone was born. Private, and kept by the people who knew them best.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="/sign-up" variant="loudSun" size="lg">
                  Start a story
                </ButtonLink>
                <ButtonLink href="/example" variant="secondary" size="lg">
                  Read Peggy&rsquo;s story
                </ButtonLink>
              </div>
            </div>
            <div className="relative mx-auto hidden w-full max-w-[22rem] lg:block">
              <div className="brutal-lg rotate-3 bg-paper p-3">
                <span aria-hidden="true" className="absolute -top-4 left-1/2 z-[1] h-7 w-24 -translate-x-1/2 -rotate-6 border-[length:var(--line-thin)] border-black bg-sun/90" />
                <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius)*0.6)] border-[length:var(--line)] border-black">
                  <Image src="/demo/whitby-return-2021.jpg" alt="Whitby at dusk" fill priority sizes="22rem" className="object-cover" />
                </div>
                <p className="mt-3 font-display text-small display-case">Peggy, back in Whitby at 70</p>
              </div>
              <div className="absolute -bottom-6 -left-10 flex size-28 -rotate-12 items-center justify-center rounded-full border-[length:var(--button-line)] border-black bg-pink text-center font-display text-small leading-tight">
                75 AND
                <br />
                COUNTING
              </div>
            </div>
          </div>
          <div className="mt-16 px-14 sm:px-16">
            <HeroLifeline />
          </div>
        </div>
      </section>

      {/* A life, in order */}
      <section className="dots border-b-[length:var(--line)] border-black">
        <div className="mx-auto grid max-w-[90rem] gap-14 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20 lg:py-28">
          <div className="lg:sticky lg:top-12 lg:self-start">
            <h2 className="text-[clamp(2.5rem,4.5vw,4rem)] display-case leading-[0.9]">
              Not a photo album. <span className="bg-sun box-decoration-clone px-1">A life, in order.</span>
            </h2>
            <div className="mt-8 flex max-w-[30rem] flex-col gap-4 text-body font-medium">
              <p>
                Photos scattered across phones and shoeboxes lose their story. TimeLyn puts each one back in its place:
                the year it happened, how old they were, who was there and who remembers it.
              </p>
              <p>
                A life is split into chapters, so a childhood in Whitby and forty years in Leeds each read as what they
                were. Dates can be exact, or just &ldquo;around 1962&rdquo;.
              </p>
              <p>And voices matter. Record your gran telling it herself, or the sound of the beach she walked as a girl.</p>
            </div>
          </div>

          <div className="flex flex-col gap-10">
            <p className="tag self-start bg-black text-white">From Peggy Ellison&rsquo;s story. The family is fictional.</p>
            <ExcerptCard
              date={formatPartialDate(sandsend.date)}
              age={age(sandsend.date)}
              title={sandsend.title}
              body="Every summer Dad shut the shop for one Saturday and we walked the beach to Sandsend and back."
              credit="In Peggy's own words"
              tilt="-rotate-1"
            >
              <div className="relative aspect-[3/2] border-b-[length:var(--line)] border-black">
                <Image src="/demo/sandsend-1959.jpg" alt="Low tide at Sandsend, 1959" fill sizes="(min-width: 1024px) 40rem, 90vw" className="object-cover" />
              </div>
            </ExcerptCard>
            <ExcerptCard
              date={formatPartialDate(wedding.date)}
              age={age(wedding.date)}
              title={wedding.title}
              body="It rained from start to finish and nobody minded. Mum made her own dress from a pattern in Woman's Own."
              credit="Shared by Ruth Ellison, daughter"
              milestone
              tilt="rotate-1 lg:ml-10"
            />
            <ExcerptCard
              date={formatPartialDate(sound.date)}
              age={age(sound.date)}
              title={sound.title}
              body="Gran's knee was too bad for the walk, so I went on my own and recorded the sea for her."
              credit="Shared by Tom Ellison, grandson"
            >
              <div className="border-b-[length:var(--line)] border-black bg-pink p-4">
                <AudioPlayer src="/demo/sandsend-waves.wav" title="The sound of Sandsend" duration={22} />
              </div>
            </ExcerptCard>
          </div>
        </div>
      </section>

      {/* How a story grows */}
      <section className="border-b-[length:var(--line)] border-black bg-paper">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-24">
          <h2 className="text-[clamp(2.25rem,4vw,3.5rem)] display-case leading-[0.9]">How a story grows</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, body, fill], i) => (
              <li key={title} className={cn("brutal p-6", fill)}>
                <span className="font-display text-[3.5rem] leading-none">{i + 1}</span>
                <h3 className="mt-4 text-h3">{title}</h3>
                <p className="mt-2 text-body font-medium">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Living and remembered */}
      <section className="dots border-b-[length:var(--line)] border-black">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-24">
          <h2 className="max-w-4xl text-[clamp(2.25rem,4vw,3.5rem)] display-case leading-[0.9]">
            For the people still here, and the people we miss.
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {[
              {
                img: "/demo/garden-2014.jpg",
                name: "Peggy, born 1951",
                tag: "bg-mint",
                text: "Start a story with someone while they can tell it themselves. Sit down with your mum, record her voice, and let the grandkids ask their questions.",
              },
              {
                img: "/demo/walter-workshop-1985.jpg",
                name: "Walt, 1946 to 2019",
                tag: "bg-paper",
                text: "Or gather what a family remembers of someone who has gone: the workshop, the fiddle, the arguments, the walks along the canal.",
              },
            ].map((c) => (
              <figure key={c.name} className="brutal">
                <div className="relative aspect-[3/2] border-b-[length:var(--line)] border-black">
                  <Image src={c.img} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="p-6">
                  <p className={cn("tag font-display font-normal display-case", c.tag)}>{c.name}</p>
                  <p className="mt-3 max-w-md text-body font-medium">{c.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Private by design */}
      <section className="border-b-[length:var(--line)] border-black bg-black text-white">
        <div className="mx-auto grid max-w-[90rem] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20 lg:py-24">
          <h2 className="text-[clamp(2.25rem,4vw,3.5rem)] display-case leading-[0.9]">Private by design, because families are.</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["Only the people you invite", "No public profiles, no search listings. A story is visible to its members and nobody else."],
              ["Nothing appears unapproved", "Every contribution waits for the story keeper, so the story reads the way the family wants."],
              ["Each family keeps its own", "Photos and recordings are stored privately and shown only through short-lived links to members."],
              ["Books and keepsakes, later", "Printed life-story books and photo albums are in the works. Everything you gather now will be ready for them."],
            ].map(([title, body]) => (
              <div key={title} className="card-on-dark p-5">
                <h3 className="text-body font-bold">{title}</h3>
                <p className="mt-2 text-ui text-night-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sun">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-24">
          <h2 className="max-w-3xl text-[clamp(2.5rem,5vw,4.5rem)] display-case leading-[0.88]">Whose story will you start?</h2>
          <p className="mt-5 text-lede font-medium">It takes a minute to begin, and a lifetime to finish.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="/sign-up" variant="loud" size="lg">
              Start a story
            </ButtonLink>
            <Link href="/example" className="text-body font-bold underline decoration-[3px] underline-offset-4 hover:bg-paper">
              See an example first
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
