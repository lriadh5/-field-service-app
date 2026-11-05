"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { updateCompany } from "@/lib/accounts";
import { requireMember } from "@/lib/session";
import { CompanySchema, firstError } from "@/lib/validation";
import type { Trade } from "@/lib/config";
import type { FormState } from "./types";

export async function updateCompanyAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireMember("admin");
  const parsed = CompanySchema.safeParse({
    name: form.get("name"), phone: form.get("phone") ?? "", email: form.get("email") ?? "", address: form.get("address") ?? "",
    license: form.get("license") ?? "", logoUrl: form.get("logoUrl") ?? "", terms: form.get("terms") ?? "", payNote: form.get("payNote") ?? "",
    taxRate: form.get("taxRate") || 0, reviewLink: form.get("reviewLink") ?? "", trades: form.getAll("trades"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { taxRate, trades, ...rest } = parsed.data;
  await updateCompany(await getDb(), me.company.id, { ...rest, trades: trades as Trade[], taxRateBps: Math.round(taxRate * 100) });
  revalidatePath("/app", "layout");
  return { ok: "Saved." };
}
