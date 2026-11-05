import Link from "next/link";
import { getDb } from "@/db";
import { listMembers } from "@/lib/accounts";
import { requireMember } from "@/lib/session";
import { TRADES } from "@/lib/config";

export const metadata = { title: "Today" };

export default async function Today({ searchParams }: PageProps<"/app">) {
  const me = await requireMember();
  const sp = await searchParams;
  const members = await listMembers(await getDb(), me.company.id);
  const c = me.company;
  const steps = [
    { done: Boolean(c.phone && c.address), label: "Add your business phone and address", href: "/app/settings" },
    { done: Boolean(c.license), label: "Add your license number for invoices", href: "/app/settings" },
    { done: Boolean(c.reviewLink), label: "Add your Google review link", href: "/app/settings" },
    { done: members.length > 1, label: "Invite your technicians and office staff", href: "/app/team" },
  ];
  const left = steps.filter((s) => !s.done).length;
  return (
    <>
      {sp.welcome && <p className="alert alert-ok">Your account is ready. Welcome aboard, {me.user.name.split(" ")[0]}.</p>}
      {sp.joined && <p className="alert alert-ok">You joined {c.name}.</p>}
      {sp.denied && <p className="alert alert-warn">That page is for owners and office admins.</p>}

      <div>
        <p className="label">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="text-3xl">Good to see you, {me.user.name.split(" ")[0]}</h1>
      </div>

      {me.role !== "tech" && left > 0 && (
        <section className="card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl">Finish setting up</h2>
            <span className="mono text-sm text-[var(--muted)]">{steps.length - left}/{steps.length}</span>
          </div>
          <ul className="flex flex-col">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 py-2 border-b border-[var(--line)] last:border-0">
                <span aria-hidden className={`grid place-items-center w-6 h-6 rounded-full text-xs font-bold ${s.done ? "bg-[var(--ok)] text-[var(--surface)]" : "border border-[var(--line)]"}`}>{s.done ? "✓" : ""}</span>
                {s.done ? <span className="text-[var(--muted)] line-through">{s.label}</span> : <Link href={s.href} className="font-semibold text-[var(--accent)]">{s.label}</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="text-xl">Your trades</h2>
        <div className="flex flex-wrap gap-2">{c.trades.map((t) => <span key={t} className="pill pill-info">{TRADES[t]}</span>)}</div>
      </section>

      <section className="card border-dashed">
        <h2 className="text-xl">Coming in the next update</h2>
        <p className="text-[var(--muted)]">Clients, quotes, jobs and scheduling, the technician&apos;s day, and invoices move in here next, followed by the client portal.</p>
      </section>
    </>
  );
}
