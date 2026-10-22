"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { signOut } from "@/app/(auth)/actions";

const item =
  "flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-ui text-ink outline-none data-[highlighted]:bg-paper-sunk";

export function AccountMenu({ name, email }: { name: string; email: string | null }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="flex items-center gap-2.5 rounded-soft py-1 pl-1 pr-2 text-ui text-ink hover:bg-paper-sunk data-[state=open]:bg-paper-sunk"
        aria-label={`Account menu for ${name}`}
      >
        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-cyan-wash font-serif text-body text-cyan">
          {name.trim()[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="hidden max-w-40 truncate sm:inline">{name}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-60 rounded-soft border border-rule bg-paper-raised p-1.5 shadow-[0_12px_32px_-12px_rgb(20_30_38/0.28)]"
        >
          <div className="px-3 pb-2 pt-1.5">
            <p className="text-ui font-medium text-ink">{name}</p>
            {email ? <p className="truncate text-small text-ink-soft">{email}</p> : null}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-rule" />
          <DropdownMenu.Item asChild className={item}>
            <Link href="/stories">Your stories</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={item}>
            <Link href="/stories/new">Start a new story</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={item}>
            <Link href="/account">Account</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-rule" />
          <form action={signOut}>
            <DropdownMenu.Item asChild className={item} onSelect={(e) => e.preventDefault()}>
              <button type="submit">Sign out</button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
