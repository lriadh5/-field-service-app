import { and, eq, gt, isNull, sql, count } from "drizzle-orm";
import type { Db } from "@/db";
import { companies, invites, memberships, sessions, users, type Company, type User } from "@/db/schema";
import { INVITE_DAYS, SESSION_DAYS, TRIAL_DAYS, type Role, type Trade } from "./config";
import { getDummyHash, hashPassword, newToken, sha256, verifyPassword } from "./auth/crypto";

export class AccountError extends Error {}

const days = (n: number) => new Date(Date.now() + n * 864e5);
const normEmail = (e: string) => e.trim().toLowerCase();

/* ---------- sign-up & login ---------- */

export async function signUp(
  db: Db,
  input: { name: string; email: string; password: string; companyName: string; trades: Trade[] },
): Promise<{ userId: string; companyId: string }> {
  const email = normEmail(input.email);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) throw new AccountError("An account with this email already exists. Log in instead.");
  const passwordHash = await hashPassword(input.password);
  return db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ email, name: input.name.trim(), passwordHash }).returning({ id: users.id });
    const [company] = await tx
      .insert(companies)
      .values({ name: input.companyName.trim(), email, trades: input.trades, status: "trialing", plan: "trial", trialEndsAt: days(TRIAL_DAYS) })
      .returning({ id: companies.id });
    await tx.insert(memberships).values({ companyId: company.id, userId: user.id, role: "owner" });
    return { userId: user.id, companyId: company.id };
  });
}

export async function verifyCredentials(db: Db, email: string, password: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, normEmail(email))).limit(1);
  if (!user) {
    await verifyPassword(password, await getDummyHash());
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

/* ---------- sessions ---------- */

export async function createSession(db: Db, userId: string, companyId: string | null): Promise<{ token: string; expiresAt: Date }> {
  const token = newToken();
  const expiresAt = days(SESSION_DAYS);
  await db.insert(sessions).values({ id: sha256(token), userId, companyId, expiresAt });
  return { token, expiresAt };
}

export async function deleteSession(db: Db, token: string) {
  await db.delete(sessions).where(eq(sessions.id, sha256(token)));
}

export type SessionContext = {
  sessionId: string;
  user: Pick<User, "id" | "email" | "name">;
  company: Company | null;
  role: Role | null;
};

/** Resolves a cookie token to the user and their active company. Falls back to their first company. */
export async function resolveSession(db: Db, token: string): Promise<SessionContext | null> {
  const sessionId = sha256(token);
  const [row] = await db
    .select({ s: sessions, u: { id: users.id, email: users.email, name: users.name } })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  const mine = await listCompaniesForUser(db, row.u.id);
  const active = mine.find((m) => m.company.id === row.s.companyId) ?? mine[0] ?? null;
  if (active && active.company.id !== row.s.companyId) {
    await db.update(sessions).set({ companyId: active.company.id }).where(eq(sessions.id, sessionId));
  }
  return { sessionId, user: row.u, company: active?.company ?? null, role: active?.role ?? null };
}

export async function switchCompany(db: Db, token: string, userId: string, companyId: string): Promise<boolean> {
  const m = await getMembership(db, userId, companyId);
  if (!m) return false;
  await db.update(sessions).set({ companyId }).where(eq(sessions.id, sha256(token)));
  return true;
}

/* ---------- memberships ---------- */

export async function getMembership(db: Db, userId: string, companyId: string) {
  const [m] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.companyId, companyId)))
    .limit(1);
  return m ?? null;
}

export async function listCompaniesForUser(db: Db, userId: string) {
  return db
    .select({ company: companies, role: memberships.role })
    .from(memberships)
    .innerJoin(companies, eq(companies.id, memberships.companyId))
    .where(eq(memberships.userId, userId))
    .orderBy(memberships.createdAt);
}

export async function listMembers(db: Db, companyId: string) {
  return db
    .select({ membershipId: memberships.id, role: memberships.role, userId: users.id, name: users.name, email: users.email, joinedAt: memberships.createdAt })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.companyId, companyId))
    .orderBy(memberships.createdAt);
}

async function ownerCount(db: Db, companyId: string) {
  const [r] = await db.select({ n: count() }).from(memberships).where(and(eq(memberships.companyId, companyId), eq(memberships.role, "owner")));
  return Number(r?.n ?? 0);
}

/** What a member with `actor` role may do to a member with `target` role. */
export function canManage(actor: Role, target: Role): boolean {
  if (actor === "owner") return true;
  if (actor === "admin") return target !== "owner";
  return false;
}

export async function changeRole(db: Db, companyId: string, actorRole: Role, membershipId: string, role: Role) {
  const [m] = await db.select().from(memberships).where(and(eq(memberships.id, membershipId), eq(memberships.companyId, companyId))).limit(1);
  if (!m) throw new AccountError("That team member wasn't found.");
  if (!canManage(actorRole, m.role) || !canManage(actorRole, role)) throw new AccountError("You don't have permission to make that change.");
  if (m.role === "owner" && role !== "owner" && (await ownerCount(db, companyId)) <= 1) throw new AccountError("A company needs at least one owner.");
  await db.update(memberships).set({ role }).where(eq(memberships.id, m.id));
}

export async function removeMember(db: Db, companyId: string, actorRole: Role, membershipId: string) {
  const [m] = await db.select().from(memberships).where(and(eq(memberships.id, membershipId), eq(memberships.companyId, companyId))).limit(1);
  if (!m) throw new AccountError("That team member wasn't found.");
  if (!canManage(actorRole, m.role)) throw new AccountError("You don't have permission to remove this person.");
  if (m.role === "owner" && (await ownerCount(db, companyId)) <= 1) throw new AccountError("A company needs at least one owner.");
  await db.delete(memberships).where(eq(memberships.id, m.id));
}

/* ---------- invites ---------- */

export async function createInvite(db: Db, input: { companyId: string; email: string; role: Role; invitedBy: string; actorRole: Role }) {
  if (!canManage(input.actorRole, input.role)) throw new AccountError("You can't invite someone with that role.");
  const email = normEmail(input.email);
  const already = await db
    .select({ id: memberships.id })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.companyId, input.companyId), eq(users.email, email)))
    .limit(1);
  if (already.length) throw new AccountError("That person is already on your team.");
  // Replace any earlier open invite for the same email so only the newest link works.
  await db.delete(invites).where(and(eq(invites.companyId, input.companyId), eq(invites.email, email), isNull(invites.acceptedAt)));
  const token = newToken();
  await db.insert(invites).values({ companyId: input.companyId, email, role: input.role, tokenHash: sha256(token), invitedBy: input.invitedBy, expiresAt: days(INVITE_DAYS) });
  return token;
}

export async function listOpenInvites(db: Db, companyId: string) {
  return db
    .select({ id: invites.id, email: invites.email, role: invites.role, expiresAt: invites.expiresAt })
    .from(invites)
    .where(and(eq(invites.companyId, companyId), isNull(invites.acceptedAt), gt(invites.expiresAt, new Date())))
    .orderBy(invites.createdAt);
}

export async function revokeInvite(db: Db, companyId: string, inviteId: string) {
  await db.delete(invites).where(and(eq(invites.id, inviteId), eq(invites.companyId, companyId), isNull(invites.acceptedAt)));
}

export async function findInvite(db: Db, token: string) {
  const [row] = await db
    .select({ invite: invites, companyName: companies.name })
    .from(invites)
    .innerJoin(companies, eq(companies.id, invites.companyId))
    .where(and(eq(invites.tokenHash, sha256(token)), isNull(invites.acceptedAt), gt(invites.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

/**
 * Joins the invite's company. A signed-in user must have the invited email;
 * otherwise a new account is created with the invited email.
 */
export async function acceptInvite(
  db: Db,
  token: string,
  who: { userId: string; email: string } | { name: string; password: string },
): Promise<{ userId: string; companyId: string }> {
  const found = await findInvite(db, token);
  if (!found) throw new AccountError("This invite link has expired or was already used. Ask for a new one.");
  const { invite } = found;
  if ("userId" in who && normEmail(who.email) !== invite.email) {
    throw new AccountError(`This invite is for ${invite.email}. Log out and open the link again.`);
  }
  const passwordHash = "password" in who ? await hashPassword(who.password) : null;
  const userId = await db.transaction(async (tx) => {
    const claimed = await tx
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(and(eq(invites.id, invite.id), isNull(invites.acceptedAt)))
      .returning({ id: invites.id });
    if (!claimed.length) throw new AccountError("This invite was already used.");
    let uid: string;
    if ("userId" in who) {
      uid = who.userId;
    } else {
      const [existing] = await tx.select({ id: users.id }).from(users).where(eq(users.email, invite.email)).limit(1);
      if (existing) throw new AccountError(`An account for ${invite.email} already exists. Log in first, then open this link again.`);
      const [u] = await tx.insert(users).values({ email: invite.email, name: who.name.trim(), passwordHash: passwordHash! }).returning({ id: users.id });
      uid = u.id;
    }
    await tx.insert(memberships).values({ companyId: invite.companyId, userId: uid, role: invite.role }).onConflictDoNothing();
    return uid;
  });
  return { userId, companyId: invite.companyId };
}

/* ---------- company ---------- */

export async function updateCompany(
  db: Db,
  companyId: string,
  fields: Partial<Pick<Company, "name" | "phone" | "email" | "address" | "license" | "logoUrl" | "terms" | "payNote" | "taxRateBps" | "reviewLink" | "trades">>,
) {
  await db.update(companies).set(fields).where(eq(companies.id, companyId));
}

/* ---------- platform admin ---------- */

export async function listAllCompanies(db: Db) {
  return db
    .select({
      company: companies,
      members: sql<number>`(select count(*) from ${memberships} where ${memberships.companyId} = ${companies.id})`.mapWith(Number),
    })
    .from(companies)
    .orderBy(sql`${companies.createdAt} desc`);
}
