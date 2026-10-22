import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" intro="Enter the email you signed up with and we'll send you a link to choose a new password.">
      <ForgotPasswordForm />
      <p className="mt-8 text-ui text-ink-soft">
        <Link href="/sign-in" className="link">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
