import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MomentForm } from "@/components/moments/moment-form";
import { shortName } from "@/lib/domain/names";
import { can } from "@/lib/domain/permissions";
import { ServiceError } from "@/lib/services/errors";
import { loadMoment } from "@/lib/services/moments";
import { loadStoryPage, uploadConfig } from "@/lib/story-page";
import { saveMomentAction } from "../../../actions";

export const metadata: Metadata = { title: "Edit moment" };

export default async function EditMomentPage({ params }: PageProps<"/s/[slug]/m/[id]/edit">) {
  const { slug, id } = await params;
  const { story, role, viewer, repo } = await loadStoryPage(slug);
  const moment = await loadMoment(repo, { story, role }, viewer, id).catch((error) => {
    if (error instanceof ServiceError && error.code === "not_found") notFound();
    throw error;
  });
  if (!can.editMoment(role, viewer.id, moment)) redirect(`/s/${slug}/m/${id}`);
  const editor = can.review(role);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link href={`/s/${slug}/m/${id}`} className="link text-small">Back to the moment</Link>
      <h1 className="mt-4 text-h1 uppercase">Edit moment</h1>
      {moment.reviewNote && moment.status === "changes_requested" ? (
        <div className="mt-6 border-[3px] border-black bg-sun px-5 py-4 shadow-brutal-sm">
          <p className="text-ui font-medium text-ink">The story keeper asked</p>
          <p className="mt-1 text-body font-medium">&ldquo;{moment.reviewNote}&rdquo;</p>
        </div>
      ) : null}
      {!editor ? (
        <p className="mt-4 max-w-xl text-body text-ink-soft">Your changes will go back to the story keeper for another look.</p>
      ) : null}
      <div className="mt-10">
        <MomentForm
          action={saveMomentAction.bind(null, slug, id)}
          storyId={story.id}
          subjectFirstName={shortName(story.subjectName, story.knownAs)}
          uploadConfig={uploadConfig()}
          moment={moment}
          isEditor={editor}
          submitLabel={editor ? "Save changes" : "Send changes for review"}
        />
      </div>
    </main>
  );
}
