import type { Metadata } from "next";
import { DisplayNameForm, UpdatePasswordForm } from "@/components/auth/forms";
import { requireViewer } from "@/lib/auth/session";
import { isDemo } from "@/lib/config";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const viewer = await requireViewer("/account");
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-h1">Account</h1>
      <p className="mt-3 text-body text-ink-soft">Signed in as {viewer.email ?? viewer.displayName}.</p>
      <section aria-labelledby="name" className="mt-12 border-t border-rule pt-8">
        <h2 id="name" className="text-h3">Name</h2>
        <div className="mt-6 max-w-md">
          <DisplayNameForm current={viewer.displayName} />
        </div>
      </section>
      {!isDemo() ? (
        <section id="password" aria-labelledby="password-title" className="mt-12 border-t border-rule pt-8">
          <h2 id="password-title" className="text-h3">Password</h2>
          <div className="mt-6 max-w-md">
            <UpdatePasswordForm />
          </div>
        </section>
      ) : null}
    </main>
  );
}
