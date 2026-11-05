import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { platformAdminEmails, SESSION_COOKIE, type Role } from "./config";
import { createSession, resolveSession, type SessionContext } from "./accounts";

/** The signed-in user for this request, or null. Memoized per request. */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveSession(await getDb(), token);
});

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function startSession(userId: string, companyId: string | null) {
  const { token, expiresAt } = await createSession(await getDb(), userId, companyId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

const RANK: Record<Role, number> = { tech: 1, admin: 2, owner: 3 };

/** Requires a signed-in member of a company, optionally with at least `min` role. */
export async function requireMember(min: Role = "tech") {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!s.company || !s.role) redirect("/no-company");
  if (RANK[s.role] < RANK[min]) redirect("/app?denied=1");
  return { ...s, company: s.company, role: s.role };
}

export async function requirePlatformAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!platformAdminEmails().includes(s.user.email.toLowerCase())) redirect("/app");
  return s;
}

export function isPlatformAdmin(email: string) {
  return platformAdminEmails().includes(email.toLowerCase());
}
