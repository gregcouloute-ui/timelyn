import Image from "next/image";
import Link from "next/link";
import { HeroLifeline } from "@/components/marketing/hero-lifeline";
import { HeroVideo } from "@/components/marketing/hero-video";
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


export default function Home() {
  const { story, moments } = exampleStory();
  const pick = (title: string) => moments.find((m) => m.title === title)!;
  const sandsend = pick("A day at Sandsend");
  const wedding = pick("Wedding at St Michael's");
  const sound = pick("The sound of Sandsend");
  const age = (d: (typeof moments)[number]["date"]) => formatAge(ageAt(story.birthDate, d));

  return (
    <main id="main">
      {/* Hero: say plainly what TimeLyn is, then show it */}
      <section className="border-b-[length:var(--line)] border-black bg-pop">
        <div className="mx-auto max-w-[90rem] px-4 pb-14 pt-12 sm:px-8 lg:pb-16 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
            <div>
              <h1 className="text-[clamp(2.6rem,5.4vw,5rem)] display-case leading-[0.92] tracking-[-0.035em]">
                Build the story of someone&rsquo;s life, together.
              </h1>
              <p className="mt-6 max-w-[34rem] text-lede font-medium">
                TimeLyn is a private online timeline of one person&rsquo;s life, from the day they were born to today. Their
                family add photos, memories and voice notes, and it all falls into place, year by year.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="/sign-up" variant="loudSun" size="lg">
                  Start a story
                </ButtonLink>
                <ButtonLink href="/example" variant="secondary" size="lg">
                  See an example
                </ButtonLink>
              </div>
            </div>
            <HeroVideo />
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              ["Pick someone", "A mum, a grandad, a best friend, or yourself. Living or remembered."],
              ["Invite the family", "Send them a private link. They add the photos and stories they have."],
              ["Watch their life fill in", "Every memory lands in its year. You approve what goes in."],
            ].map(([title, body], i) => (
              <li key={title} className="brutal flex gap-4 p-5">
                <span className="font-display text-[2.5rem] leading-none">{i + 1}</span>
                <span>
                  <span className="block text-body font-bold">{title}</span>
                  <span className="mt-1 block text-ui font-medium text-ink-soft">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Who it's for: concrete reasons to start */}
      <section className="border-b-[length:var(--line)] border-black bg-paper">
        <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-8 lg:py-20">
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] display-case leading-[0.95]">What people use it for</h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["A gift for Mum's 70th", "Get the whole family adding their favourite stories, then show her the finished timeline.", "bg-sun"],
              ["Remembering Grandad", "Everyone adds what they remember, so the stories don't disappear with him.", "bg-mint"],
              ["Your gran, in her own words", "Sit down together, record her voice, and let the grandkids ask their questions.", "bg-pink"],
              ["Your own story", "Start your own timeline and invite the people who were there.", "bg-coral"],
            ].map(([title, body, fill]) => (
              <li key={title} className={cn("brutal p-6", fill)}>
                <h3 className="text-h3">{title}</h3>
                <p className="mt-2 text-body font-medium">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The lifeline, drawn */}
      <section className="dots border-b-[length:var(--line)] border-black">
        <div className="mx-auto max-w-[90rem] px-4 pb-14 pt-16 sm:px-8">
          <p className="text-center text-body font-bold">One life, from the day they were born:</p>
          <div className="mt-8 px-14 sm:px-16">
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
