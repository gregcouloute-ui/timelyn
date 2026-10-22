import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { DemoPersonas } from "@/components/auth/demo-personas";
import { SignInForm } from "@/components/auth/forms";
import { FormMessage } from "@/components/ui/field";
import { getViewer, safeNext } from "@/lib/auth/session";
import { isDemo } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getViewer()) redirect(next);
  const linkError = params.error === "link";
  const signUpHref = `/sign-up${next !== "/stories" ? `?next=${encodeURIComponent(next)}` : ""}`;

  if (isDemo()) {
    return (
      <AuthShell
        title="Choose who you are"
        intro="This is a demonstration. Step into the Ellison family as one of its members to see what each role can do."
      >
        <DemoPersonas next={next} />
        <p className="mt-6 text-small text-ink-soft">
          Or <Link href={signUpHref} className="link">create a demo account</Link> to start a story of your own.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" intro="Welcome back. Your family's stories are where you left them.">
      {linkError ? (
        <div className="mb-6">
          <FormMessage tone="error">That link has expired or has already been used. Sign in, or request a new one.</FormMessage>
        </div>
      ) : null}
      <SignInForm next={next} />
      <p className="mt-8 text-ui text-ink-soft">
        New to TimeLyn? <Link href={signUpHref} className="link">Create an account</Link>
      </p>
    </AuthShell>
  );
}
