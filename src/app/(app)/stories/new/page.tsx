import type { Metadata } from "next";
import Link from "next/link";
import { StoryForm } from "@/components/story/story-form";
import { requireViewer } from "@/lib/auth/session";
import { createStoryAction } from "../actions";

export const metadata: Metadata = { title: "Start a story" };

export default async function NewStoryPage() {
  await requireViewer("/stories/new");
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link href="/stories" className="link text-small">Your stories</Link>
      <h1 className="mt-4 text-h1">Whose story is this?</h1>
      <p className="mt-4 max-w-xl text-body text-ink-soft">
        You&rsquo;ll be the story keeper. You can change any of this later, and nothing is shared until you invite
        someone.
      </p>
      <div className="mt-10">
        <StoryForm action={createStoryAction} submitLabel="Begin the story" />
      </div>
    </main>
  );
}
