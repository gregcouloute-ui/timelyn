"use client";

import { AlertDialog } from "radix-ui";
import { useState, useTransition, type ReactNode } from "react";
import type { FormState } from "@/lib/validation";
import { Button, buttonClass } from "./button";

interface ConfirmProps {
  trigger: ReactNode;
  triggerVariant?: "secondary" | "quiet" | "danger";
  title: string;
  description: ReactNode;
  confirmLabel: string;
  action: () => Promise<FormState | void>;
  destructive?: boolean;
}

/** Asks before doing something that can't be undone. */
export function Confirm({ trigger, triggerVariant = "quiet", title, description, confirmLabel, action, destructive = true }: ConfirmProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setError(null);
      }}
    >
      <AlertDialog.Trigger
        className={
          triggerVariant === "quiet"
            ? "text-ui font-bold text-danger underline decoration-2 underline-offset-4 hover:bg-coral hover:text-black"
            : buttonClass(triggerVariant, "sm")
        }
      >
        {trigger}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-[fade_160ms_ease-out]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border-[3px] border-black bg-paper p-6 shadow-brutal-lg focus:outline-none">
          <AlertDialog.Title className="font-display text-h3 uppercase">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-3 text-body text-ink-soft">{description}</div>
          </AlertDialog.Description>
          {error ? (
            <p role="alert" className="mt-4 text-ui text-danger">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <AlertDialog.Cancel className={buttonClass("secondary", "md")}>Cancel</AlertDialog.Cancel>
            <Button
              variant={destructive ? "danger" : "primary"}
              pending={pending}
              onClick={() =>
                start(async () => {
                  const result = await action();
                  if (result && result.status === "error") setError(result.message ?? "That didn't work. Try again.");
                  else setOpen(false);
                })
              }
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
