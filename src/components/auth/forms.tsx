"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updateDisplayName, updatePassword } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, describedBy } from "@/components/ui/field";
import { idle, type FormState } from "@/lib/validation";

function errorsOf(state: FormState) {
  return state.status === "error" ? state.fieldErrors : {};
}
function valuesOf(state: FormState) {
  return state.status === "error" ? (state.values ?? {}) : {};
}

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, idle);
  const errors = errorsOf(state);
  const values = valuesOf(state);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.status === "error" && state.message ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <Field id="email" label="Email address" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={values.email}
          aria-invalid={Boolean(errors.email) || undefined} aria-describedby={describedBy("email", null, errors.email)} />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required
          aria-invalid={Boolean(errors.password) || undefined} aria-describedby={describedBy("password", null, errors.password)} />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <Button type="submit" pending={pending}>Sign in</Button>
        <Link href="/forgot-password" className="link text-small">Forgotten your password?</Link>
      </div>
    </form>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUp, idle);
  const errors = errorsOf(state);
  const values = valuesOf(state);
  if (state.status === "success") return <FormMessage tone="success">{state.message}</FormMessage>;
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.status === "error" && state.message ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <Field id="displayName" label="Your name" hint="As your family knows you. Shown next to everything you add." error={errors.displayName}>
        <Input id="displayName" name="displayName" autoComplete="name" required defaultValue={values.displayName}
          aria-invalid={Boolean(errors.displayName) || undefined} aria-describedby={describedBy("displayName", true, errors.displayName)} />
      </Field>
      <Field id="email" label="Email address" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={values.email}
          aria-invalid={Boolean(errors.email) || undefined} aria-describedby={describedBy("email", null, errors.email)} />
      </Field>
      <Field id="password" label="Password" hint="At least 10 characters." error={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10}
          aria-invalid={Boolean(errors.password) || undefined} aria-describedby={describedBy("password", true, errors.password)} />
      </Field>
      <div className="pt-1">
        <Button type="submit" pending={pending}>Create account</Button>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idle);
  const errors = errorsOf(state);
  if (state.status === "success") return <FormMessage tone="success">{state.message}</FormMessage>;
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field id="email" label="Email address" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required
          aria-invalid={Boolean(errors.email) || undefined} aria-describedby={describedBy("email", null, errors.email)} />
      </Field>
      <div><Button type="submit" pending={pending}>Send reset link</Button></div>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, idle);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}
      {state.status === "error" && state.message ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <Field id="password" label="New password" hint="At least 10 characters." error={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10}
          aria-invalid={Boolean(errors.password) || undefined} aria-describedby={describedBy("password", true, errors.password)} />
      </Field>
      <div><Button type="submit" pending={pending}>Save password</Button></div>
    </form>
  );
}

export function DisplayNameForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(updateDisplayName, idle);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}
      <Field id="displayName" label="Your name" hint="Shown next to everything you add to a story." error={errors.displayName}>
        <Input id="displayName" name="displayName" autoComplete="name" required defaultValue={current}
          aria-invalid={Boolean(errors.displayName) || undefined} aria-describedby={describedBy("displayName", true, errors.displayName)} />
      </Field>
      <div><Button type="submit" pending={pending}>Save name</Button></div>
    </form>
  );
}
