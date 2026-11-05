"use server";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { AccountError, acceptInvite, deleteSession, signUp, switchCompany, verifyCredentials } from "@/lib/accounts";
import { clearSessionCookie, getSession, getSessionToken, startSession } from "@/lib/session";
import { firstError, LoginSchema, password, personName, SignupSchema } from "@/lib/validation";
import type { Trade } from "@/lib/config";
import type { FormState } from "./types";

export async function signupAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = SignupSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    companyName: form.get("companyName"),
    trades: form.getAll("trades"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  try {
    const { userId, companyId } = await signUp(await getDb(), { ...parsed.data, trades: parsed.data.trades as Trade[] });
    await startSession(userId, companyId);
  } catch (e) {
    if (e instanceof AccountError) return { error: e.message };
    throw e;
  }
  redirect("/app?welcome=1");
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const user = await verifyCredentials(await getDb(), parsed.data.email, parsed.data.password);
  if (!user) return { error: "That email and password don't match. Check them and try again." };
  await startSession(user.id, null);
  const next = String(form.get("next") || "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/app");
}

export async function logoutAction() {
  const token = await getSessionToken();
  if (token) await deleteSession(await getDb(), token);
  await clearSessionCookie();
  redirect("/login");
}

export async function switchCompanyAction(form: FormData) {
  const s = await getSession();
  const token = await getSessionToken();
  if (!s || !token) redirect("/login");
  await switchCompany(await getDb(), token, s.user.id, String(form.get("companyId")));
  redirect("/app");
}

export async function acceptInviteAction(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") || "");
  const db = await getDb();
  const s = await getSession();
  try {
    if (s) {
      const { companyId } = await acceptInvite(db, token, { userId: s.user.id, email: s.user.email });
      const t = await getSessionToken();
      if (t) await switchCompany(db, t, s.user.id, companyId);
    } else {
      const name = personName.safeParse(form.get("name"));
      if (!name.success) return { error: firstError(name.error) };
      const pw = password.safeParse(form.get("password"));
      if (!pw.success) return { error: firstError(pw.error) };
      const { userId, companyId } = await acceptInvite(db, token, { name: name.data, password: pw.data });
      await startSession(userId, companyId);
    }
  } catch (e) {
    if (e instanceof AccountError) return { error: e.message };
    throw e;
  }
  redirect("/app?joined=1");
}
