"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Field, FormMessage, Input, Select, describedBy } from "@/components/ui/field";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/domain/permissions";
import type { Member, Role } from "@/lib/domain/types";
import { idle, type FormState } from "@/lib/validation";

type InviteState =
  | FormState
  | { status: "invited"; email: string; link: string; expiresAt: string };

export function InviteForm({
  action,
  roles,
  subjectFirstName,
}: {
  action: (prev: InviteState, formData: FormData) => Promise<InviteState>;
  roles: Exclude<Role, "owner">[];
  subjectFirstName: string;
}) {
  const [state, formAction, pending] = useActionState(action, idle as InviteState);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const v = state.status === "error" ? (state.values ?? {}) : {};

  useEffect(() => {
    if (state.status === "invited") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      {state.status === "invited" ? (
        <div className="border-[3px] border-black bg-mint p-5 shadow-brutal" role="status">
          <p className="text-ui font-medium text-ink">Invitation ready for {state.email}</p>
          <p className="mt-1 text-small text-ink-soft">
            Send them this link however you usually keep in touch. It works once, only for {state.email}, and expires
            on {new Date(state.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}. We won&rsquo;t
            show it again.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={state.link}
              aria-label="Invitation link"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 border-[3px] border-black bg-paper px-3 py-2 text-small text-ink"
            />
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(state.link);
                setCopiedLink(state.link);
              }}
            >
              {copiedLink === state.link ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>
      ) : null}
      {state.status === "error" && state.message ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
        <Field id="invite-email" label="Their email address" error={errors.email}>
          <Input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="off"
            required
            defaultValue={v.email}
            aria-invalid={Boolean(errors.email) || undefined}
            aria-describedby={describedBy("invite-email", null, errors.email)}
          />
        </Field>
        <Field id="invite-relationship" label={`How are they connected to ${subjectFirstName}?`} optional hint="Shown beside what they add, like “Granddaughter” or “Neighbour”.">
          <Input id="invite-relationship" name="relationship" maxLength={60} autoComplete="off" defaultValue={v.relationship} />
        </Field>
        <fieldset>
          <legend className="text-ui font-medium text-ink">What can they do?</legend>
          <div className="mt-2 flex flex-col gap-2">
            {roles.map((r) => (
              <label key={r} className="flex cursor-pointer items-start gap-3 border-[3px] border-black px-4 py-3 has-[:checked]:bg-pop has-[:checked]:shadow-brutal-sm">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  defaultChecked={(v.role ?? "contributor") === r}
                  className="mt-1 size-4 accent-black"
                />
                <span>
                  <span className="block text-ui font-bold text-ink">{ROLE_LABEL[r]}</span>
                  <span className="block text-small text-ink-soft">{ROLE_DESCRIPTION[r]}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.role ? <p className="mt-1.5 text-small text-danger">{errors.role}</p> : null}
        </fieldset>
        <div>
          <Button type="submit" pending={pending}>
            Create invitation
          </Button>
        </div>
      </form>
    </div>
  );
}

export function MemberControls({
  member,
  roles,
  changeAction,
  removeAction,
  storyName,
}: {
  member: Member;
  roles: Exclude<Role, "owner">[];
  changeAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  removeAction: () => Promise<FormState>;
  storyName: string;
}) {
  const [state, formAction, pending] = useActionState(changeAction, idle);
  const formRef = useRef<HTMLFormElement>(null);
  const options = Array.from(new Set<Exclude<Role, "owner">>([...(member.role === "owner" ? [] : [member.role as Exclude<Role, "owner">]), ...roles]));

  return (
    <div className="flex flex-wrap items-center gap-4">
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={member.userId} />
        <label htmlFor={`role-${member.userId}`} className="sr-only">
          Role for {member.displayName}
        </label>
        <Select
          id={`role-${member.userId}`}
          name="role"
          defaultValue={member.role}
          disabled={pending}
          onChange={() => formRef.current?.requestSubmit()}
          compact
        >
          {options.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
      </form>
      <Confirm
        trigger="Remove"
        title={`Remove ${member.displayName}?`}
        description={
          <p>
            They&rsquo;ll lose access to {storyName}&rsquo;s story. Moments they&rsquo;ve already added stay in the
            story.
          </p>
        }
        confirmLabel="Remove"
        action={removeAction}
      />
      {state.status === "error" ? (
        <p role="alert" className="basis-full text-small text-danger">
          {state.message}
        </p>
      ) : state.status === "success" ? (
        <p role="status" className="basis-full text-small text-ok">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
