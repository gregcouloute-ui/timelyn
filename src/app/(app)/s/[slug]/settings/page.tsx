import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChaptersEditor, CoverPicker, DeleteStory } from "@/components/story/settings";
import { StoryForm } from "@/components/story/story-form";
import { shortName } from "@/lib/domain/names";
import { can } from "@/lib/domain/permissions";
import { loadStoryPage } from "@/lib/story-page";
import { deleteChapterAction, deleteStoryAction, saveChapterAction, setCoverAction, updateStoryAction } from "../actions";

export const metadata: Metadata = { title: "Story settings" };

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-6 border-t border-rule py-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
      <div>
        <h2 id={id} className="text-h3">{title}</h2>
        {intro ? <p className="mt-2 text-ui text-ink-soft">{intro}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function SettingsPage({ params }: PageProps<"/s/[slug]/settings">) {
  const { slug } = await params;
  const { story, role, repo } = await loadStoryPage(slug);
  if (!can.editStory(role)) redirect(`/s/${slug}`);
  const [chapters, images] = await Promise.all([repo.listChapters(story.id), repo.listStoryImages(story.id)]);
  const first = shortName(story.subjectName, story.knownAs);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-h1">Settings</h1>

      <div className="mt-10">
        <Section id="details" title="About them" intro="The name, dates and introduction at the top of the story.">
          <StoryForm action={updateStoryAction.bind(null, slug)} story={story} submitLabel="Save details" />
        </Section>

        <Section id="cover" title="Cover photograph" intro={`The picture behind ${first}'s name at the top of the story.`}>
          <CoverPicker images={images} current={story.coverMediaId} action={setCoverAction.bind(null, slug)} />
        </Section>

        <Section
          id="chapters"
          title="Chapters"
          intro="Chapters divide a life into its eras. Each moment falls into a chapter by its date, so you never have to sort them by hand."
        >
          <ChaptersEditor
            chapters={chapters}
            birthYear={story.birthDate.year}
            addAction={saveChapterAction.bind(null, slug, null)}
            saveAction={Object.fromEntries(chapters.map((c) => [c.id, saveChapterAction.bind(null, slug, c.id)]))}
            deleteActions={Object.fromEntries(chapters.map((c) => [c.id, deleteChapterAction.bind(null, slug, c.id)]))}
          />
        </Section>

        {can.deleteStory(role) ? (
          <Section
            id="delete"
            title="Delete the story"
            intro="Permanently removes every moment, photograph and recording, for everyone. This can't be undone."
          >
            <DeleteStory name={story.subjectName} action={deleteStoryAction.bind(null, slug)} />
          </Section>
        ) : null}
      </div>
    </main>
  );
}
