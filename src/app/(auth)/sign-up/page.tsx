import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/forms";
import { getViewer, safeNext } from "@/lib/auth/session";
import { isDemo } from "@/lib/config";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getViewer()) redirect(next);
  const signInHref = `/sign-in${next !== "/stories" ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <AuthShell
      title="Create your account"
      intro={
        isDemo()
          ? "Demo accounts live only in this server's memory and need no password confirmation."
          : "Start a story for someone you love, or accept an invitation from your family."
      }
    >
      <SignUpForm next={next} />
      <p className="mt-8 text-ui text-ink-soft">
        Already have an account? <Link href={signInHref} className="link">Sign in</Link>
      </p>
    </AuthShell>
  );
}
