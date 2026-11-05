"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { AccountError, changeRole, createInvite, removeMember, revokeInvite } from "@/lib/accounts";
import { requireMember } from "@/lib/session";
import { firstError, InviteSchema } from "@/lib/validation";
import { ROLES, type Role } from "@/lib/config";
import type { FormState } from "./types";

async function origin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export async function inviteAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireMember("admin");
  const parsed = InviteSchema.safeParse({ email: form.get("email"), role: form.get("role") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  try {
    const token = await createInvite(await getDb(), { companyId: me.company.id, email: parsed.data.email, role: parsed.data.role, invitedBy: me.user.id, actorRole: me.role });
    revalidatePath("/app/team");
    return { ok: `Invite created for ${parsed.data.email}. Send them this link. It works once and expires in 7 days.`, link: `${await origin()}/invite/${token}` };
  } catch (e) {
    if (e instanceof AccountError) return { error: e.message };
    throw e;
  }
}

export async function changeRoleAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireMember("admin");
  const role = String(form.get("role")) as Role;
  if (!(role in ROLES)) return { error: "Choose a role." };
  try {
    await changeRole(await getDb(), me.company.id, me.role, String(form.get("membershipId")), role);
  } catch (e) {
    if (e instanceof AccountError) return { error: e.message };
    throw e;
  }
  revalidatePath("/app/team");
  return { ok: "Role updated." };
}

export async function removeMemberAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireMember("admin");
  try {
    await removeMember(await getDb(), me.company.id, me.role, String(form.get("membershipId")));
  } catch (e) {
    if (e instanceof AccountError) return { error: e.message };
    throw e;
  }
  revalidatePath("/app/team");
  return { ok: "Removed from the team." };
}

export async function revokeInviteAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireMember("admin");
  await revokeInvite(await getDb(), me.company.id, String(form.get("inviteId")));
  revalidatePath("/app/team");
  return { ok: "Invite cancelled." };
}
