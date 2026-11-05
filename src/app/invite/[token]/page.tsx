import Link from "next/link";
import { acceptInviteAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/Field";
import { ProductMark } from "@/components/Logo";
import { getDb } from "@/db";
import { findInvite } from "@/lib/accounts";
import { ROLES } from "@/lib/config";
import { getSession } from "@/lib/session";

export const metadata = { title: "Join your team" };

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const found = await findInvite(await getDb(), token);
  const session = await getSession();
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="gutter py-4 max-w-xl w-full mx-auto"><ProductMark /></header>
      <main className="gutter max-w-xl w-full mx-auto flex flex-col gap-5 pb-16">
        {!found ? (
          <div className="card">
            <h1 className="text-2xl">This invite link doesn&apos;t work</h1>
            <p className="text-[var(--muted)]">It has expired or was already used. Ask your manager to send a new invite.</p>
            <Link href="/login" className="btn self-start">Go to log in</Link>
          </div>
        ) : (
          <>
            <div>
              <p className="label">Team invite</p>
              <h1 className="text-3xl">Join {found.companyName}</h1>
              <p className="text-[var(--muted)]">You&apos;ve been invited as <b>{ROLES[found.invite.role]}</b> using <b>{found.invite.email}</b>.</p>
            </div>
            <div className="card">
              {session ? (
                <ActionForm action={acceptInviteAction} submitLabel={`Join ${found.companyName}`} pendingLabel="Joining…">
                  <input type="hidden" name="token" value={token} />
                  <p>You&apos;re logged in as <b>{session.user.email}</b>.</p>
                </ActionForm>
              ) : (
                <ActionForm action={acceptInviteAction} submitLabel="Create account and join" pendingLabel="Joining…">
                  <input type="hidden" name="token" value={token} />
                  <Field label="Email" name="emailShown" value={found.invite.email} readOnly disabled />
                  <Field label="Your name" name="name" required autoComplete="name" />
                  <Field label="Choose a password" name="password" type="password" required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
                  <p className="text-sm text-[var(--muted)]">Already have an account with this email? <Link className="text-[var(--accent)] font-semibold" href={`/login?next=/invite/${token}`}>Log in first</Link>.</p>
                </ActionForm>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
