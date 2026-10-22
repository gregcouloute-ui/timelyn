"use client";

import { useActionState, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { DateFields } from "@/components/ui/date-fields";
import { Checkbox, Field, FormMessage, Input, Textarea, describedBy } from "@/components/ui/field";
import type { Moment } from "@/lib/domain/types";
import { idle, type FormState } from "@/lib/validation";
import { MediaUploader, type UploadConfig } from "./media-uploader";

interface MomentFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  storyId: string;
  subjectFirstName: string;
  uploadConfig: UploadConfig;
  moment?: Moment;
  isEditor: boolean;
  submitLabel: string;
}

export function MomentForm({ action, storyId, subjectFirstName, uploadConfig, moment, isEditor, submitLabel }: MomentFormProps) {
  const [state, formAction, pending] = useActionState(action, idle);
  const [uploading, setUploading] = useState(false);
  const onBusyChange = useCallback((b: boolean) => setUploading(b), []);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const v = state.status === "error" ? (state.values ?? {}) : {};
  const val = (key: string, fallback: string | number | null | undefined) => (key in v ? v[key] : (fallback ?? ""));

  return (
    <form action={formAction} className="flex flex-col gap-9" noValidate>
      {state.status === "error" && state.message ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <Field id="title" label="What would you call this moment?" error={errors.title} hint="A few words, like a chapter heading. “Leaving for Leeds”, “The big snow”.">
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={val("title", moment?.title)}
          aria-invalid={Boolean(errors.title) || undefined}
          aria-describedby={describedBy("title", true, errors.title)}
          className="text-lede font-bold"
        />
      </Field>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        <DateFields
          idPrefix="date"
          legend="When was it?"
          hint="The year is enough. Add more if you know it."
          names={{ year: "year", month: "month", day: "day", circa: "circa" }}
          defaults={{
            year: val("year", moment?.date.year),
            month: val("month", moment?.date.month),
            day: val("day", moment?.date.day),
            circa: "circa" in v ? v.circa === "on" : moment?.date.circa,
          }}
          errors={errors}
        />
        <Field id="place" label="Where?" optional error={errors.place} className="lg:mt-[2.15rem]">
          <Input id="place" name="place" maxLength={120} autoComplete="off" placeholder="A place, a house, a town" defaultValue={val("place", moment?.place)} />
        </Field>
      </div>

      <Field
        id="body"
        label="The story"
        optional
        hint="Write it as you'd tell it. What happened, who was there, what you remember most."
        error={errors.body}
      >
        <Textarea
          id="body"
          name="body"
          rows={9}
          maxLength={8000}
          defaultValue={val("body", moment?.body)}
          aria-invalid={Boolean(errors.body) || undefined}
          aria-describedby={describedBy("body", true, errors.body)}
          className="text-story"
        />
      </Field>

      <MediaUploader storyId={storyId} config={uploadConfig} initial={moment?.media ?? []} onBusyChange={onBusyChange} />

      <Field id="people" label="Who else is part of it?" optional hint="Separate names with commas." error={errors.people}>
        <Input id="people" name="people" autoComplete="off" placeholder="Jean, Alan, Dad" defaultValue={val("people", moment?.people.join(", "))} />
      </Field>

      {isEditor ? (
        <Checkbox
          id="isMilestone"
          name="isMilestone"
          defaultChecked={"isMilestone" in v ? v.isMilestone === "on" : moment?.isMilestone}
          label="Mark as a milestone"
          hint={`Milestones are the turning points of ${subjectFirstName}'s life. They stand out on the timeline.`}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t-[length:var(--line)] border-black pt-6">
        <Button type="submit" pending={pending} disabled={uploading}>
          {submitLabel}
        </Button>
        {uploading ? (
          <span className="text-small text-ink-soft" role="status">
            Waiting for files to finish uploading.
          </span>
        ) : !isEditor ? (
          <span className="text-small text-ink-soft">The story keeper will look at it before it appears in the story.</span>
        ) : null}
      </div>
    </form>
  );
}
