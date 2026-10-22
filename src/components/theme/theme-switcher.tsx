"use client";

import { DropdownMenu } from "radix-ui";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { DEFAULT_THEME, THEMES, THEME_COOKIE, toThemeId, type ThemeId } from "@/lib/themes";

function Swatches({ colours, className }: { colours: readonly string[]; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex", className)}>
      {colours.map((c, i) => (
        <span
          key={c}
          className="size-4 rounded-full border-[1.5px] border-black"
          style={{ background: c, marginLeft: i ? -5 : 0 }}
        />
      ))}
    </span>
  );
}

/** The theme on <html>, kept in sync across every switcher on the page. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Lets anyone switch the look of TimeLyn. Remembered in this browser. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const theme = useSyncExternalStore<ThemeId>(
    subscribe,
    () => toThemeId(document.documentElement.dataset.theme),
    () => DEFAULT_THEME,
  );
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  const choose = (value: string) => {
    const id = toThemeId(value);
    document.documentElement.dataset.theme = id;
    document.cookie = `${THEME_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "press flex h-10 items-center gap-2 bg-paper-raised px-3 text-small font-bold text-ink hover:bg-sun data-[state=open]:bg-sun",
          className,
        )}
        aria-label={`Change style. Current style: ${current.name}`}
      >
        <Swatches colours={current.swatches} />
        <span className="hidden sm:inline">Style</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="brutal z-50 w-72 p-1.5">
          <DropdownMenu.Label className="px-3 pb-1 pt-2 text-small font-bold text-ink-soft">Choose a style</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={theme} onValueChange={choose}>
            {THEMES.map((t) => (
              <DropdownMenu.RadioItem
                key={t.id}
                value={t.id}
                className="flex cursor-pointer select-none items-center gap-3 rounded-[min(var(--radius),12px)] px-3 py-2.5 outline-none data-[highlighted]:bg-sun data-[state=checked]:bg-pop"
              >
                <Swatches colours={t.swatches} />
                <span className="min-w-0 flex-1">
                  <span className="block text-ui font-bold text-ink">{t.name}</span>
                  <span className="block text-caption text-ink-soft">{t.description}</span>
                </span>
                <DropdownMenu.ItemIndicator>
                  <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  </svg>
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
