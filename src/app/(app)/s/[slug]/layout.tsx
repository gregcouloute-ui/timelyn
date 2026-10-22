import { StoryBar } from "@/components/story/story-bar";
import { atLeast, can } from "@/lib/domain/permissions";
import { familiarName } from "@/lib/domain/names";
import { loadStoryPage } from "@/lib/story-page";

export default async function StoryLayout({ children, params }: LayoutProps<"/s/[slug]">) {
  const { slug } = await params;
  const { story, role, repo } = await loadStoryPage(slug);
  const awaiting = can.review(role) ? await repo.countMoments(story.id, "pending") : 0;
  const base = `/s/${story.slug}`;

  const tabs = [
    { href: base, label: "Story", exact: true },
    ...(atLeast(role, "contributor") ? [{ href: `${base}/add`, label: "Add a moment" }] : []),
    ...(atLeast(role, "contributor") && !can.review(role) ? [{ href: `${base}/mine`, label: "Your contributions" }] : []),
    ...(can.review(role) ? [{ href: `${base}/review`, label: "Review", count: awaiting }] : []),
    { href: `${base}/people`, label: "People" },
    ...(can.editStory(role) ? [{ href: `${base}/settings`, label: "Settings" }] : []),
  ];

  return (
    <>
      <StoryBar slug={story.slug} name={familiarName(story.subjectName, story.knownAs)} tabs={tabs} />
      {children}
    </>
  );
}
