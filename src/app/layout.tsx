import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { DemoBanner } from "@/components/layout/demo-banner";
import { siteUrl } from "@/lib/config";
import { THEME_COOKIE, toThemeId } from "@/lib/themes";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "TimeLyn: every life is a story worth keeping",
    template: "%s – TimeLyn",
  },
  description:
    "TimeLyn gathers a family's photographs, memories and recordings into one life story, told in order from the day someone was born.",
  applicationName: "TimeLyn",
  openGraph: {
    title: "TimeLyn",
    description: "Every life is a story worth keeping.",
    siteName: "TimeLyn",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = toThemeId((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en-GB" data-theme={theme}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
