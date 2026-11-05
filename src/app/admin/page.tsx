import Link from "next/link";
import { getDb } from "@/db";
import { listAllCompanies } from "@/lib/accounts";
import { requirePlatformAdmin } from "@/lib/session";
import { ProductMark } from "@/components/Logo";
import { TRADES } from "@/lib/config";

export const metadata = { title: "Platform admin" };

const STATUS: Record<string, string> = { trialing: "pill-info", active: "pill-ok", past_due: "pill-warn", canceled: "pill-bad" };

export default async function AdminPage() {
  await requirePlatformAdmin();
  const rows = await listAllCompanies(await getDb());
  const count = (s: string) => rows.filter((r) => r.company.status === s).length;
  return (
    <div className="min-h-dvh">
      <header className="gutter max-w-6xl mx-auto py-4 flex items-center justify-between gap-3">
        <ProductMark />
        <Link href="/app" className="btn btn-sm">Back to app</Link>
      </header>
      <main className="gutter max-w-6xl mx-auto flex flex-col gap-6 pb-16">
        <div>
          <p className="label">Platform admin · only you see this</p>
          <h1 className="text-3xl">Subscribing businesses</h1>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[["All businesses", rows.length], ["On trial", count("trialing")], ["Paying", count("active")], ["Past due", count("past_due")]].map(([l, n]) => (
            <div key={l} className="card !gap-1"><span className="label">{l}</span><b className="text-3xl font-[family-name:var(--font-display)] mono">{n}</b></div>
          ))}
        </div>
        <div className="overflow-x-auto card !p-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--sunk)] text-left">
              <tr>{["Business", "Trades", "Team", "Status", "Trial ends", "Signed up"].map((h) => <th key={h} className="label !text-[.68rem] px-4 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(({ company: c, members }) => (
                <tr key={c.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3"><b>{c.name}</b><div className="text-xs text-[var(--muted)]">{c.email}</div></td>
                  <td className="px-4 py-3">{c.trades.map((t) => TRADES[t]).join(", ")}</td>
                  <td className="px-4 py-3 mono">{members}</td>
                  <td className="px-4 py-3"><span className={`pill ${STATUS[c.status] ?? ""}`}>{c.status.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 mono">{c.trialEndsAt ? new Date(c.trialEndsAt).toLocaleDateString("en-US") : "—"}</td>
                  <td className="px-4 py-3 mono">{new Date(c.createdAt).toLocaleDateString("en-US")}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-[var(--muted)]">No businesses have signed up yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
