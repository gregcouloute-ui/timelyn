"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { signOut } from "@/app/(auth)/actions";

const item =
  "flex w-full cursor-pointer select-none items-center px-3 py-2 text-ui font-medium text-ink outline-none data-[highlighted]:bg-sun";

export function AccountMenu({ name, email }: { name: string; email: string | null }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="flex items-center gap-2.5 border-[3px] border-black bg-paper py-1 pl-1 pr-3 text-ui font-bold text-ink shadow-brutal-sm hover:bg-sun data-[state=open]:bg-sun"
        aria-label={`Account menu for ${name}`}
      >
        <span aria-hidden="true" className="flex size-8 items-center justify-center border-2 border-black bg-pop font-display text-body text-black">
          {name.trim()[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="hidden max-w-40 truncate sm:inline">{name}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-60 border-[3px] border-black bg-paper p-1.5 shadow-brutal"
        >
          <div className="px-3 pb-2 pt-1.5">
            <p className="text-ui font-bold text-ink">{name}</p>
            {email ? <p className="truncate text-small text-ink-soft">{email}</p> : null}
          </div>
          <DropdownMenu.Separator className="my-1 h-[2px] bg-black" />
          <DropdownMenu.Item asChild className={item}>
            <Link href="/stories">Your stories</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={item}>
            <Link href="/stories/new">Start a new story</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={item}>
            <Link href="/account">Account</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-[2px] bg-black" />
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
