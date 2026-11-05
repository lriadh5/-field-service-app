import { changeRoleAction, inviteAction, removeMemberAction, revokeInviteAction } from "@/app/actions/team";
import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/Field";
import { getDb } from "@/db";
import { canManage, listMembers, listOpenInvites } from "@/lib/accounts";
import { ROLES, type Role } from "@/lib/config";
import { requireMember } from "@/lib/session";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireMember("admin");
  const db = await getDb();
  const [members, open] = await Promise.all([listMembers(db, me.company.id), listOpenInvites(db, me.company.id)]);
  const assignable = (Object.keys(ROLES) as Role[]).filter((r) => canManage(me.role, r));
  return (
    <>
      <div>
        <h1 className="text-3xl">Team</h1>
        <p className="text-[var(--muted)]">Technicians see their jobs and schedule. Office admins also manage clients, billing settings and the team.</p>
      </div>

      <section className="card">
        <h2 className="text-xl">Invite someone</h2>
        <ActionForm action={inviteAction} submitLabel="Create invite link" pendingLabel="Creating…">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <Field label="Their email" name="email" type="email" required />
            <label className="field" htmlFor="invite-role">
              <span>Role</span>
              <select id="invite-role" name="role" className="input" defaultValue="tech">
                <option value="tech">{ROLES.tech}</option>
                <option value="admin">{ROLES.admin}</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-[var(--muted)]">Email sending isn&apos;t connected yet, so you&apos;ll get a link to text or email them yourself.</p>
        </ActionForm>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Members <span className="mono text-sm text-[var(--muted)]">{members.length}</span></h2>
        <ul className="card !p-0 !gap-0">
          {members.map((m) => {
            const self = m.userId === me.user.id;
            const editable = !self && canManage(me.role, m.role);
            return (
              <li key={m.membershipId} className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--line)] last:border-0">
                <div className="min-w-0 flex-1">
                  <b className="block truncate">{m.name}{self && <span className="text-[var(--muted)] font-normal"> (you)</span>}</b>
                  <span className="block text-sm text-[var(--muted)] truncate">{m.email}</span>
                </div>
                {editable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionForm action={changeRoleAction} submitLabel="Update" buttonClass="btn btn-sm" inline>
                      <input type="hidden" name="membershipId" value={m.membershipId} />
                      <label className="sr-only" htmlFor={`role-${m.membershipId}`}>Role for {m.name}</label>
                      <select id={`role-${m.membershipId}`} name="role" defaultValue={m.role} className="input !min-h-[34px] !py-1 w-40">
                        {assignable.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
                      </select>
                    </ActionForm>
                    <ActionForm action={removeMemberAction} submitLabel="Remove" pendingLabel="Removing…" buttonClass="btn btn-sm btn-danger" inline>
                      <input type="hidden" name="membershipId" value={m.membershipId} />
                    </ActionForm>
                  </div>
                ) : (
                  <span className={`pill ${m.role === "owner" ? "pill-info" : ""}`}>{ROLES[m.role]}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {open.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">Waiting to join</h2>
          <ul className="card !p-0 !gap-0">
            {open.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--line)] last:border-0">
                <div className="min-w-0 flex-1">
                  <b className="block truncate">{i.email}</b>
                  <span className="text-sm text-[var(--muted)]">{ROLES[i.role]} · link expires {new Date(i.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <ActionForm action={revokeInviteAction} submitLabel="Cancel invite" pendingLabel="Cancelling…" buttonClass="btn btn-sm" inline>
                  <input type="hidden" name="inviteId" value={i.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
