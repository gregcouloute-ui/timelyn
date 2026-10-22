"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { DateFields } from "@/components/ui/date-fields";
import { Checkbox, Field, FormMessage, Input, Textarea, describedBy } from "@/components/ui/field";
import type { Story } from "@/lib/domain/types";
import { idle, type FormState } from "@/lib/validation";

interface StoryFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  story?: Story;
  submitLabel: string;
}

export function StoryForm({ action, story, submitLabel }: StoryFormProps) {
  const [state, formAction, pending] = useActionState(action, idle);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const v = state.status === "error" ? (state.values ?? {}) : {};
  const [remembered, setRemembered] = useState(v.remembered ? v.remembered === "on" : Boolean(story?.deathDate));

  const val = (key: string, fallback: string | number | null | undefined) => (key in v ? v[key] : (fallback ?? ""));

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      {state.status === "error" && state.message ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}

      <div className="grid gap-6 sm:grid-cols-[1.4fr_1fr]">
        <Field id="subjectName" label="Full name" hint="The name they were known by in official records." error={errors.subjectName}>
          <Input id="subjectName" name="subjectName" required autoComplete="off" defaultValue={val("subjectName", story?.subjectName)}
            aria-invalid={Boolean(errors.subjectName) || undefined} aria-describedby={describedBy("subjectName", true, errors.subjectName)} />
        </Field>
        <Field id="knownAs" label="Known as" optional hint="What family and friends call them." error={errors.knownAs}>
          <Input id="knownAs" name="knownAs" autoComplete="off" defaultValue={val("knownAs", story?.knownAs)}
            aria-invalid={Boolean(errors.knownAs) || undefined} aria-describedby={describedBy("knownAs", true, errors.knownAs)} />
        </Field>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        <DateFields
          idPrefix="birth"
          legend="Born"
          hint="Only the year is needed."
          names={{ year: "birthYear", month: "birthMonth", day: "birthDay", circa: "birthCirca" }}
          defaults={{
            year: val("birthYear", story?.birthDate.year),
            month: val("birthMonth", story?.birthDate.month),
            day: val("birthDay", story?.birthDate.day),
            circa: "birthCirca" in v ? v.birthCirca === "on" : story?.birthDate.circa,
          }}
          errors={errors}
        />
        <Field id="birthPlace" label="Place of birth" optional error={errors.birthPlace} className="lg:mt-[2.15rem]">
          <Input id="birthPlace" name="birthPlace" autoComplete="off" placeholder="Town or city" defaultValue={val("birthPlace", story?.birthPlace)}
            aria-invalid={Boolean(errors.birthPlace) || undefined} />
        </Field>
      </div>

      <div className="flex flex-col gap-6 border-t-[length:var(--line)] border-black pt-6">
        <Checkbox
          id="remembered"
          name="remembered"
          // Uncontrolled on purpose: React resets forms after an action, and
          // defaultChecked keeps the reset state in step with what's shown.
          defaultChecked={remembered}
          onChange={(e) => setRemembered(e.target.checked)}
          label="This person has died"
          hint="TimeLyn is for the living as much as the remembered. Leave this unticked for someone who's still with you."
        />
        {remembered ? (
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
            <DateFields
              idPrefix="death"
              legend="Died"
              names={{ year: "deathYear", month: "deathMonth", day: "deathDay" }}
              defaults={{
                year: val("deathYear", story?.deathDate?.year),
                month: val("deathMonth", story?.deathDate?.month),
                day: val("deathDay", story?.deathDate?.day),
              }}
              errors={errors}
            />
            <Field id="deathPlace" label="Place of death" optional error={errors.deathPlace} className="lg:mt-[2.15rem]">
              <Input id="deathPlace" name="deathPlace" autoComplete="off" defaultValue={val("deathPlace", story?.deathPlace)} />
            </Field>
          </div>
        ) : null}
      </div>

      <Field
        id="introduction"
        label="A few words to open their story"
        optional
        hint="Shown at the top of the story. Who they are, in a sentence or two."
        error={errors.introduction}
      >
        <Textarea id="introduction" name="introduction" rows={4} maxLength={2000} defaultValue={val("introduction", story?.introduction)}
          aria-invalid={Boolean(errors.introduction) || undefined} aria-describedby={describedBy("introduction", true, errors.introduction)}
          className="text-story" />
      </Field>

      <div>
        <Button type="submit" pending={pending}>{submitLabel}</Button>
      </div>
    </form>
  );
}
