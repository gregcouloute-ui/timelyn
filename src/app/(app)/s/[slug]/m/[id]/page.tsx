import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { attribution } from "@/components/timeline/timeline";
import { MomentRecordings } from "@/components/timeline/moment-media";
import { MomentMarker } from "@/components/timeline/markers";
import { StoryImage } from "@/components/timeline/story-image";
import { ButtonLink } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Notice } from "@/components/ui/notice";
import { ageAt, formatAge, formatPartialDate } from "@/lib/domain/dates";
import { can } from "@/lib/domain/permissions";
import type { Moment } from "@/lib/domain/types";
import { ServiceError } from "@/lib/services/errors";
import { loadMoment, neighbours } from "@/lib/services/moments";
import { loadStoryPage } from "@/lib/story-page";
import { listJoin, paragraphs } from "@/lib/text";
import { deleteMomentAction } from "../../actions";

async function load(slug: string, id: string) {
  const ctx = await loadStoryPage(slug);
  try {
    const moment = await loadMoment(ctx.repo, ctx, ctx.viewer, id);
    return { ...ctx, moment };
  } catch (error) {
    if (error instanceof ServiceError && error.code === "not_found") notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/s/[slug]/m/[id]">): Promise<Metadata> {
  const { slug, id } = await params;
  const { moment } = await load(slug, id);
  return { title: moment.title };
}

function StatusPanel({ moment, slug, canEdit }: { moment: Moment; slug: string; canEdit: boolean }) {
  if (moment.status === "published") return null;
  const copy = {
    pending: { title: "Waiting for review", body: "Only you and the story's keepers can see this until it's approved." },
    changes_requested: { title: "Changes requested", body: null },
    declined: { title: "Not included in the story", body: "The story keeper decided not to include this. Only you and they can see it." },
  }[moment.status];
  return (
    <div className="mb-10 border-[3px] border-black bg-sun px-5 py-4 shadow-brutal-sm">
      <p className="font-display text-body uppercase text-ink">{copy.title}</p>
      {moment.reviewNote ? (
        <p className="mt-1.5 text-body font-medium text-ink">&ldquo;{moment.reviewNote}&rdquo;</p>
      ) : null}
      {copy.body ? <p className="mt-1 text-ui text-ink-soft">{copy.body}</p> : null}
      {canEdit && moment.status !== "declined" ? (
        <ButtonLink href={`/s/${slug}/m/${moment.id}/edit`} size="sm" variant="secondary" className="mt-4">
          {moment.status === "changes_requested" ? "Make changes" : "Edit"}
        </ButtonLink>
      ) : null}
    </div>
  );
}

export default async function MomentPage({ params, searchParams }: PageProps<"/s/[slug]/m/[id]">) {
  const { slug, id } = await params;
  const query = await searchParams;
  const { story, role, viewer, repo, moment } = await load(slug, id);
  const access = { story, role };
  const { previous, next } = moment.status === "published" ? await neighbours(repo, access, moment) : { previous: null, next: null };
  const images = moment.media.filter((m) => m.kind === "image");
  const age = formatAge(ageAt(story.birthDate, moment.date));
  const canEdit = can.editMoment(role, viewer.id, moment);
  const canDelete = can.deleteMoment(role, viewer.id, moment);
  const base = `/s/${slug}`;

  return (
    <main id="main" className="pb-24">
      <div className="mx-auto max-w-[64rem] px-4 pt-8 sm:px-8">
        <Link href={moment.status === "published" ? `${base}#moment-${moment.id}` : `${base}/mine`} className="link text-small">
          {moment.status === "published" ? "Back to the story" : "Back to your contributions"}
        </Link>
      </div>

      <article className="mx-auto max-w-[64rem] px-4 pt-8 sm:px-8" aria-labelledby="moment-title">
        <Notice value={query.notice} className="mb-8" />
        <StatusPanel moment={moment} slug={slug} canEdit={canEdit} />

        <header className="max-w-[44rem]">
          <p className="flex items-center gap-3 text-ui text-ink-soft">
            <MomentMarker milestone={moment.isMilestone} filled={images.length > 0} />
            <span>
              <time className="numerals-oldstyle">{formatPartialDate(moment.date)}</time>
              {age ? <span>. {age}.</span> : null}
            </span>
          </p>
          <h1 id="moment-title" className="mt-3 text-h1 uppercase">
            {moment.title}
          </h1>
          {moment.place || moment.people.length ? (
            <p className="mt-4 text-body text-ink-soft">
              {moment.place}
              {moment.place && moment.people.length ? ". " : ""}
              {moment.people.length ? `With ${listJoin(moment.people)}.` : moment.place ? "." : ""}
            </p>
          ) : null}
        </header>

        {images.length ? (
          <div className="mt-10 flex flex-col gap-10">
            {images.map((m, i) => (
              <figure key={m.id}>
                <div className="brutal overflow-hidden">
                  <StoryImage media={m} sizes="(min-width: 1024px) 60rem, 100vw" priority={i === 0} />
                </div>
                {m.caption ? <figcaption className="mt-3 max-w-[44rem] text-ui text-ink-soft">{m.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        ) : null}

        <MomentRecordings media={moment.media} title={moment.title} className="mt-10 max-w-[44rem]" />

        {moment.body ? (
          <div className="prose-story mt-10">
            {paragraphs(moment.body).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : null}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t-[3px] border-black pt-6">
          <p className="text-ui text-ink-soft">{attribution(moment)}.</p>
          {canEdit || canDelete ? (
            <div className="flex items-center gap-5">
              {canEdit && moment.status === "published" ? (
                <ButtonLink href={`${base}/m/${moment.id}/edit`} variant="secondary" size="sm">
                  Edit
                </ButtonLink>
              ) : null}
              {canDelete ? (
                <Confirm
                  trigger="Remove"
                  title="Remove this moment?"
                  description={
                    <p>
                      &ldquo;{moment.title}&rdquo; and its {moment.media.length ? "photographs and recordings" : "text"} will be
                      permanently deleted. This can&rsquo;t be undone.
                    </p>
                  }
                  confirmLabel="Remove moment"
                  action={deleteMomentAction.bind(null, slug, moment.id)}
                />
              ) : null}
            </div>
          ) : null}
        </footer>
      </article>

      {previous || next ? (
        <nav aria-label="More moments" className="mx-auto mt-16 grid max-w-[64rem] gap-6 px-4 sm:grid-cols-2 sm:px-8">
          {[previous, next].map((m, i) =>
            m ? (
              <Link key={m.id} href={`${base}/m/${m.id}`} className={`press group block bg-paper p-5 hover:bg-pop ${i === 1 ? "sm:text-right" : ""}`}>
                <span className="tag">{i === 0 ? "Earlier" : "Later"}, {formatPartialDate(m.date)}</span>
                <span className="mt-1 block text-h3 font-bold group-hover:bg-pop">{m.title}</span>
              </Link>
            ) : (
              <span key={i} className="hidden sm:block" />
            ),
          )}
        </nav>
      ) : null}
    </main>
  );
}
