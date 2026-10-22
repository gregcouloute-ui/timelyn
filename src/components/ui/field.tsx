import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const inputBase =
  "w-full rounded-soft border border-rule-strong bg-paper-raised text-ink placeholder:text-ink-faint transition-colors focus:border-cyan focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cyan aria-[invalid=true]:border-danger disabled:opacity-60";

export const inputClass = `${inputBase} px-3.5 py-2.5 text-body`;
const compactClass = `${inputBase} px-3 py-1.5 text-small`;

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

/** Label, control, hint and error, wired together for assistive technology. */
export function Field({ id, label, hint, error, optional, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-ui font-medium text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-ink-faint">(optional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="-mt-0.5 text-small text-ink-soft">
          {hint}
        </p>
      ) : null}
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-small text-danger" role="alert">
      {message}
    </p>
  );
}

export function describedBy(id: string, hint?: unknown, error?: unknown) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(inputClass, "leading-relaxed", className)} />;
}

export function Select({ className, children, compact, ...props }: ComponentProps<"select"> & { compact?: boolean }) {
  return (
    <div className="relative">
      <select {...props} className={cn(compact ? compactClass : inputClass, "appearance-none pr-9", className)}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-ink-soft"
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </div>
  );
}

export function Checkbox({ label, hint, className, id, ...props }: ComponentProps<"input"> & { label: ReactNode; hint?: ReactNode; id: string }) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        type="checkbox"
        id={id}
        {...props}
        className="mt-1 size-4 shrink-0 cursor-pointer accent-[var(--cyan)]"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div>
        <label htmlFor={id} className="cursor-pointer text-ui text-ink">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-small text-ink-soft">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** A form-level message, announced to screen readers. */
export function FormMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-soft border-l-2 px-4 py-3 text-ui",
        tone === "error" ? "border-danger bg-danger-wash text-ink" : "border-ok bg-ok-wash text-ink",
      )}
    >
      {children}
    </div>
  );
}
