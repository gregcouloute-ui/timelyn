import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MomentForm } from "@/components/moments/moment-form";
import { shortName } from "@/lib/domain/names";
import { can } from "@/lib/domain/permissions";
import { loadStoryPage, uploadConfig } from "@/lib/story-page";
import { saveMomentAction } from "../actions";

export const metadata: Metadata = { title: "Add a moment" };

export default async function AddMomentPage({ params }: PageProps<"/s/[slug]/add">) {
  const { slug } = await params;
  const { story, role } = await loadStoryPage(slug);
  if (!can.contribute(role)) redirect(`/s/${slug}`);
  const first = shortName(story.subjectName, story.knownAs);
  const editor = can.review(role);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-h1 uppercase">Add a moment</h1>
      <p className="mt-4 max-w-xl text-body text-ink-soft">
        {editor
          ? `It will appear in ${first}'s story straight away, in its place on the timeline.`
          : `Share something from ${first}'s life. The story keeper will review it, and you'll see here if they have any questions.`}
      </p>
      <div className="mt-10">
        <MomentForm
          action={saveMomentAction.bind(null, slug, null)}
          storyId={story.id}
          subjectFirstName={first}
          uploadConfig={uploadConfig()}
          isEditor={editor}
          submitLabel={editor ? "Add to the story" : "Send for review"}
        />
      </div>
    </main>
  );
}
