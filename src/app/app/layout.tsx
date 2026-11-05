import { getDb } from "@/db";
import { listCompaniesForUser } from "@/lib/accounts";
import { requireMember, isPlatformAdmin } from "@/lib/session";
import { logoutAction, switchCompanyAction } from "@/app/actions/auth";
import { AppNav } from "@/components/AppNav";
import { Mark } from "@/components/Logo";
import { ROLES } from "@/lib/config";

function trialDaysLeft(end: Date | null): number | null {
  if (!end) return null;
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 864e5));
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMember();
  const mine = await listCompaniesForUser(await getDb(), me.user.id);
  const manager = me.role !== "tech";
  const nav = [{ href: "/app", label: "Today" }, ...(manager ? [{ href: "/app/team", label: "Team" }, { href: "/app/settings", label: "Settings" }] : [])];
  if (isPlatformAdmin(me.user.email)) nav.push({ href: "/admin", label: "Platform admin" });

  const daysLeft = trialDaysLeft(me.company.trialEndsAt);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 bg-[var(--surface)] border-b border-[var(--line)]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="gutter max-w-5xl mx-auto py-3 flex items-center gap-3">
          <Mark text={me.company.name} src={me.company.logoUrl || undefined} />
          <div className="min-w-0 flex-1">
            {mine.length > 1 ? (
              <form action={switchCompanyAction} className="flex items-center gap-2">
                <label htmlFor="company-switch" className="sr-only">Switch business</label>
                <select id="company-switch" name="companyId" defaultValue={me.company.id} className="input !min-h-0 !py-1 font-semibold max-w-56">
                  {mine.map((m) => <option key={m.company.id} value={m.company.id}>{m.company.name}</option>)}
                </select>
                <button className="btn btn-sm">Switch</button>
              </form>
            ) : (
              <b className="block truncate font-[family-name:var(--font-display)] text-lg">{me.company.name}</b>
            )}
            <span className="block text-xs text-[var(--muted)] truncate">{me.user.name} · {ROLES[me.role]}</span>
          </div>
          <form action={logoutAction}><button className="btn btn-sm">Log out</button></form>
        </div>
        <div className="gutter max-w-5xl mx-auto pb-2"><AppNav items={nav} /></div>
      </header>
      {me.company.status === "trialing" && daysLeft !== null && (
        <div className={`gutter py-2 text-sm text-center ${daysLeft <= 3 ? "bg-[var(--warn-soft)]" : "bg-[var(--accent-soft)]"}`}>
          Free trial: <b>{daysLeft} day{daysLeft === 1 ? "" : "s"} left</b>. Billing setup arrives in a later update.
        </div>
      )}
      <main className="gutter max-w-5xl w-full mx-auto py-6 flex flex-col gap-6 flex-1">{children}</main>
    </div>
  );
}
