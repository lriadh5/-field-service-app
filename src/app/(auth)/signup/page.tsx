import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/Field";
import { TradePicker } from "@/components/TradePicker";
import { TRIAL_DAYS } from "@/lib/config";
import { getSession } from "@/lib/session";

export const metadata = { title: "Start your free trial" };

export default async function SignupPage() {
  if (await getSession()) redirect("/app");
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl">Start your free trial</h1>
        <p className="text-[var(--muted)]">{TRIAL_DAYS} days free. No card needed.</p>
      </div>
      <div className="card">
        <ActionForm action={signupAction} submitLabel="Create my account" pendingLabel="Creating your account…">
          <Field label="Business name" name="companyName" required autoComplete="organization" placeholder="Cool Air Heating & Cooling" />
          <Field label="Your name" name="name" required autoComplete="name" />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
          <TradePicker selected={["appliance", "hvac"]} />
        </ActionForm>
      </div>
      <p className="text-sm">Already have an account? <Link href="/login" className="text-[var(--accent)] font-semibold">Log in</Link></p>
    </div>
  );
}
