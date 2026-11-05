import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/Field";
import { getSession } from "@/lib/session";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/app");
  const { next } = await searchParams;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl">Log in</h1>
      <div className="card">
        <ActionForm action={loginAction} submitLabel="Log in" pendingLabel="Logging in…">
          <input type="hidden" name="next" value={typeof next === "string" ? next : ""} />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label="Password" name="password" type="password" required autoComplete="current-password" />
        </ActionForm>
      </div>
      <p className="text-sm">New here? <Link href="/signup" className="text-[var(--accent)] font-semibold">Start a free trial</Link></p>
    </div>
  );
}
