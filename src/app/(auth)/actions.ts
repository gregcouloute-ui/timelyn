"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { appMode, siteUrl } from "@/lib/config";
import { demoRepository } from "@/lib/data/demo/store";
import { DEMO_COOKIE, getViewer, safeNext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { echoValues, parseForm, signInSchema, signUpSchema, type FormState } from "@/lib/validation";

const demoCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const next = safeNext(formData.get("next"));
  const parsed = parseForm(signInSchema, formData);
  if (!parsed.ok) return parsed.state;

  if (appMode() === "demo") {
    const user = demoRepository.findUserByEmail(parsed.data.email);
    if (!user) {
      return {
        status: "error",
        message: "In demo mode, choose one of the family members above, or create a demo account.",
        fieldErrors: {},
        values: echoValues(formData),
      };
    }
    (await cookies()).set(DEMO_COOKIE, user.id, demoCookieOptions);
    redirect(next);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const unconfirmed = error.code === "email_not_confirmed";
    return {
      status: "error",
      message: unconfirmed
        ? "Confirm your email address first. We sent you a link when you created your account."
        : "That email and password don't match an account. Check them and try again.",
      fieldErrors: {},
      values: echoValues(formData),
    };
  }
  redirect(next);
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const next = safeNext(formData.get("next"));
  const parsed = parseForm(signUpSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { displayName, email, password } = parsed.data;

  if (appMode() === "demo") {
    if (demoRepository.findUserByEmail(email)) {
      return { status: "error", fieldErrors: { email: "There's already a demo account with that email." }, values: echoValues(formData) };
    }
    const user = demoRepository.createUser(displayName, email);
    (await cookies()).set(DEMO_COOKIE, user.id, demoCookieOptions);
    redirect(next);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const message =
      error.code === "weak_password"
        ? "Choose a stronger password: longer, and not one you use elsewhere."
        : error.code === "user_already_exists" || error.code === "email_exists"
          ? "There's already an account with that email. Sign in instead."
          : "We couldn't create your account just now. Try again in a moment.";
    return { status: "error", message, fieldErrors: {}, values: echoValues(formData) };
  }
  if (!data.session) {
    return {
      status: "success",
      message: `We've sent a confirmation link to ${email}. Open it on this device to finish creating your account.`,
    };
  }
  redirect(next);
}

export async function demoContinueAs(formData: FormData) {
  if (appMode() !== "demo") redirect("/sign-in");
  const id = z.uuid().safeParse(formData.get("userId"));
  const user = id.success ? demoRepository.findUser(id.data) : null;
  if (!user) redirect("/sign-in");
  (await cookies()).set(DEMO_COOKIE, user.id, demoCookieOptions);
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  if (appMode() === "demo") {
    (await cookies()).delete(DEMO_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { status: "error", fieldErrors: { email: "Enter your email address." }, values: echoValues(formData) };
  if (appMode() === "demo") {
    return { status: "success", message: "Demo accounts don't have passwords, so no email was sent. Choose a family member on the sign-in page instead." };
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/account/password`,
  });
  // Same response whether or not an account exists, to avoid revealing who has one.
  return { status: "success", message: `If there's an account for ${email.data}, a reset link is on its way.` };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ password: z.string().min(10, "Use at least 10 characters.").max(128, "Use 128 characters or fewer.") })
    .safeParse({ password: formData.get("password") });
  if (!parsed.success) return { status: "error", fieldErrors: { password: parsed.error.issues[0]?.message } };
  if (appMode() === "demo") return { status: "error", message: "Demo accounts don't use passwords.", fieldErrors: {} };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: "We couldn't change your password. Request a new reset link and try again.", fieldErrors: {} };
  return { status: "success", message: "Your password has been changed." };
}

export async function updateDisplayName(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ displayName: z.string().trim().min(1, "Enter your name.").max(80, "Keep it under 80 characters.") })
    .safeParse({ displayName: formData.get("displayName") });
  if (!parsed.success) return { status: "error", fieldErrors: { displayName: parsed.error.issues[0]?.message } };
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (appMode() === "demo") {
    const user = demoRepository.findUser(viewer.id);
    if (user) user.displayName = parsed.data.displayName;
  } else {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("profiles").update({ display_name: parsed.data.displayName }).eq("id", viewer.id);
    if (error) return { status: "error", message: "We couldn't save your name. Try again.", fieldErrors: {} };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Your name has been updated." };
}
