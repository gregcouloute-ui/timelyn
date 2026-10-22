"use client";

import { useActionState, useState } from "react";
import { StoryImage } from "@/components/timeline/story-image";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { Chapter, Media } from "@/lib/domain/types";
import { idle, type FormState } from "@/lib/validation";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function Message({ state }: { state: FormState }) {
  if (state.status === "success") return <FormMessage tone="success">{state.message}</FormMessage>;
  if (state.status === "error" && state.message) return <FormMessage tone="error">{state.message}</FormMessage>;
  return null;
}

export function CoverPicker({ images, current, action }: { images: Media[]; current: string | null; action: Action }) {
  const [state, formAction, pending] = useActionState(action, idle);
  const [selected, setSelected] = useState(current ?? "none");
  if (!images.length) {
    return <p className="text-ui text-ink-soft">Once photographs are published in the story, you can choose one for the cover here.</p>;
  }
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Message state={state} />
      {/* The choice is submitted from state, so React's post-action form reset can't clear it. */}
      <input type="hidden" name="coverMediaId" value={selected} />
      <fieldset>
        <legend className="sr-only">Cover photograph</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((m) => (
            <label key={m.id} className={cn("relative block cursor-pointer overflow-hidden border-[3px] border-black outline-offset-4", selected === m.id && "outline outline-[3px] outline-black shadow-brutal")}>
              <input type="radio" name="coverChoice" value={m.id} checked={selected === m.id} onChange={() => setSelected(m.id)} className="sr-only" />
              <StoryImage media={m} sizes="12rem" className="aspect-[3/2] object-cover" alt={m.caption ?? "Photograph"} />
              {selected === m.id ? <span className="absolute bottom-2 left-2 border-2 border-black bg-sun px-2 py-0.5 text-caption font-bold text-black">Cover</span> : null}
            </label>
          ))}
          <label className={cn("flex aspect-[3/2] cursor-pointer items-center justify-center border-[3px] border-dashed border-black text-small font-bold text-ink-soft", selected === "none" && "outline outline-[3px] outline-offset-4 outline-black")}>
            <input type="radio" name="coverChoice" value="none" checked={selected === "none"} onChange={() => setSelected("none")} className="sr-only" />
            No cover
          </label>
        </div>
      </fieldset>
      <div>
        <Button type="submit" pending={pending} disabled={selected === (current ?? "none")}>
          Use as cover
        </Button>
      </div>
    </form>
  );
}

function ChapterRow({ chapter, saveAction, deleteAction, canDelete }: { chapter: Chapter; saveAction: Action; deleteAction: () => Promise<FormState>; canDelete: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await saveAction(prev, fd);
    if (result.status === "success") setEditing(false);
    return result;
  }, idle);
  const errors = state.status === "error" ? state.fieldErrors : {};

  if (!editing) {
    return (
      <li className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-baseline gap-4 py-4">
        <span className="font-display text-h3 text-ink numerals-tabular">{chapter.startYear}</span>
        <div className="min-w-0">
          <p className="text-body text-ink">{chapter.title}</p>
          {chapter.summary ? <p className="truncate text-small text-ink-soft">{chapter.summary}</p> : null}
          {state.status === "success" ? <p className="text-small text-ok" role="status">{state.message}</p> : null}
        </div>
        <div className="flex gap-4">
          <button type="button" className="text-ui font-bold text-cyan underline decoration-2 underline-offset-2 hover:bg-sun hover:text-black" onClick={() => setEditing(true)}>
            Edit
          </button>
          {canDelete ? (
            <Confirm
              trigger="Remove"
              title={`Remove “${chapter.title}”?`}
              description={<p>No moments are deleted. They&rsquo;ll be shown in the chapter before it.</p>}
              confirmLabel="Remove chapter"
              action={deleteAction}
            />
          ) : null}
        </div>
      </li>
    );
  }
  return (
    <li className="py-5">
      <form action={formAction} className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <Field id={`start-${chapter.id}`} label="From" error={errors.startYear}>
          <Input id={`start-${chapter.id}`} name="startYear" inputMode="numeric" maxLength={4} defaultValue={chapter.startYear} className="numerals-tabular" />
        </Field>
        <Field id={`title-${chapter.id}`} label="Title" error={errors.title}>
          <Input id={`title-${chapter.id}`} name="title" maxLength={80} defaultValue={chapter.title} />
        </Field>
        <Field id={`summary-${chapter.id}`} label="Summary" optional className="sm:col-span-2" error={errors.summary}>
          <Textarea id={`summary-${chapter.id}`} name="summary" rows={2} maxLength={600} defaultValue={chapter.summary ?? ""} className="min-h-0" />
        </Field>
        {state.status === "error" && state.message ? <div className="sm:col-span-2"><FormMessage tone="error">{state.message}</FormMessage></div> : null}
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" size="sm" pending={pending}>Save chapter</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    </li>
  );
}

export function ChaptersEditor({
  chapters,
  saveAction,
  deleteActions,
  addAction,
  birthYear,
}: {
  chapters: Chapter[];
  saveAction: Record<string, Action>;
  deleteActions: Record<string, () => Promise<FormState>>;
  addAction: Action;
  birthYear: number;
}) {
  const [state, formAction, pending] = useActionState(addAction, idle);
  const errors = state.status === "error" ? state.fieldErrors : {};
  return (
    <div className="flex flex-col gap-8">
      <ul className="divide-y-2 divide-black border-y-[3px] border-black">
        {chapters.map((c) => (
          <ChapterRow key={c.id} chapter={c} saveAction={saveAction[c.id]} deleteAction={deleteActions[c.id]} canDelete={chapters.length > 1} />
        ))}
      </ul>
      <form action={formAction} className="brutal flex flex-col gap-4 bg-paper-sunk p-5" key={state.status === "success" ? state.message : "add"}>
        <p className="font-display text-body uppercase text-ink">Add a chapter</p>
        <Message state={state} />
        <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
          <Field id="new-start" label="From" error={errors.startYear}>
            <Input id="new-start" name="startYear" inputMode="numeric" maxLength={4} placeholder={String(birthYear + 18)} className="numerals-tabular" />
          </Field>
          <Field id="new-title" label="Title" error={errors.title}>
            <Input id="new-title" name="title" maxLength={80} placeholder="The years in Leeds" />
          </Field>
          <Field id="new-summary" label="Summary" optional className="sm:col-span-2">
            <Textarea id="new-summary" name="summary" rows={2} maxLength={600} className="min-h-0" />
          </Field>
        </div>
        <div>
          <Button type="submit" size="sm" pending={pending}>Add chapter</Button>
        </div>
      </form>
    </div>
  );
}

export function DeleteStory({ name, action }: { name: string; action: Action }) {
  const [state, formAction, pending] = useActionState(action, idle);
  const [typed, setTyped] = useState("");
  return (
    <form action={formAction} onReset={() => setTyped("")} className="flex flex-col gap-4">
      <Message state={state} />
      <Field id="confirmation" label={`Type “${name}” to confirm`}>
        <Input id="confirmation" name="confirmation" autoComplete="off" onChange={(e) => setTyped(e.target.value)} />
      </Field>
      <div>
        <Button type="submit" variant="danger" pending={pending} disabled={typed.trim().toLowerCase() !== name.trim().toLowerCase()}>
          Delete this story permanently
        </Button>
      </div>
    </form>
  );
}
