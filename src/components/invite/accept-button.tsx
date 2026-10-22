"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { idle, type FormState } from "@/lib/validation";

export function AcceptInvitation({ action, label }: { action: () => Promise<FormState>; label: string }) {
  const [state, formAction, pending] = useActionState(async () => action(), idle);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      <div>
        <Button type="submit" pending={pending}>{label}</Button>
      </div>
    </form>
  );
}
