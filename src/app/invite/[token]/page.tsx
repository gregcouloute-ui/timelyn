import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInvitation } from "@/components/invite/accept-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { getRepository, getViewer } from "@/lib/auth/session";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/domain/permissions";
import { familiarName } from "@/lib/domain/names";
import { acceptInvitationAction } from "./actions";

export const metadata: Metadata = { title: "Invitation", robots: { index: false } };

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const valid = /^[A-Za-z0-9_-]{20,100}$/.test(token);
  const [viewer, repo] = await Promise.all([getViewer(), getRepository()]);
  const preview = valid ? await repo.previewInvitation(token).catch(() => null) : null;

  if (!preview) {
    return (
      <AuthShell title="This link doesn't work" intro="It may have been mistyped, or the invitation was withdrawn. Ask the person who sent it for a new one.">
        <ButtonLink href="/" variant="secondary">Go to Everline</ButtonLink>
      </AuthShell>
    );
  }

  const name = familiarName(preview.subjectName, preview.knownAs);
  const next = `/invite/${token}`;

  if (preview.state !== "open") {
    const why = {
      accepted: "This invitation has already been used.",
      revoked: "This invitation has been withdrawn.",
      expired: "This invitation has expired.",
    }[preview.state];
    return (
      <AuthShell title={`${name}'s story`} intro={`${why} If you still need access, ask ${preview.invitedByName ?? "the person who invited you"} to send a new link.`}>
        <ButtonLink href={viewer ? "/stories" : "/sign-in"} variant="secondary">
          {viewer ? "Your stories" : "Sign in"}
        </ButtonLink>
      </AuthShell>
    );
  }

  const intro = (
    <>
      <p>
        {preview.invitedByName ?? "Someone in your family"} has invited you to {name}&rsquo;s story on Everline, as a{" "}
        {ROLE_LABEL[preview.role].toLowerCase()}.
      </p>
      <p className="mt-2 text-ui">{ROLE_DESCRIPTION[preview.role]}</p>
    </>
  );

  if (!viewer) {
    return (
      <AuthShell title="You're invited" intro={intro}>
        <p className="text-ui text-ink-soft">
          This invitation is for <strong className="font-medium text-ink">{preview.email}</strong>. Create an account
          or sign in with that address to accept it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={`/sign-up?next=${encodeURIComponent(next)}`}>Create an account</ButtonLink>
          <ButtonLink href={`/sign-in?next=${encodeURIComponent(next)}`} variant="secondary">
            Sign in
          </ButtonLink>
        </div>
      </AuthShell>
    );
  }

  const mismatch = (viewer.email ?? "").toLowerCase() !== preview.email;
  return (
    <AuthShell title="You're invited" intro={intro}>
      {mismatch ? (
        <div className="flex flex-col gap-4">
          <p className="text-ui text-ink">
            This invitation is for <strong className="font-medium">{preview.email}</strong>, but you&rsquo;re signed in
            as {viewer.email ?? viewer.displayName}.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="secondary">Sign out and switch account</Button>
          </form>
          <p className="text-small text-ink-soft">
            Or ask {preview.invitedByName ?? "them"} to invite {viewer.email ?? "your address"} instead.
          </p>
        </div>
      ) : (
        <AcceptInvitation action={acceptInvitationAction.bind(null, token)} label={`Join ${name}'s story`} />
      )}
      <p className="mt-8 text-small text-ink-soft">
        <Link href="/stories" className="link">Not now</Link>
      </p>
    </AuthShell>
  );
}
