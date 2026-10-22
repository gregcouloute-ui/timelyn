import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/forms";
import { requireViewer } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

/** Where password-reset links land after Supabase verifies them. */
export default async function NewPasswordPage() {
  await requireViewer("/account/password");
  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 pb-24 pt-14 sm:px-8">
      <h1 className="text-h2">Choose a new password</h1>
      <div className="mt-8">
        <UpdatePasswordForm />
      </div>
    </main>
  );
}
