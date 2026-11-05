import * as z from "zod";
import { TRADE_KEYS } from "./config";

export const email = z.email({ error: "Enter a valid email address." }).trim().toLowerCase();
export const password = z.string().min(8, { error: "Use at least 8 characters for the password." }).max(200);
export const personName = z.string().trim().min(2, { error: "Enter your full name." }).max(100);

export const SignupSchema = z.object({
  name: personName,
  email,
  password,
  companyName: z.string().trim().min(2, { error: "Enter your business name." }).max(120),
  trades: z.array(z.enum(TRADE_KEYS as [string, ...string[]])).min(1, { error: "Pick at least one trade." }),
});

export const LoginSchema = z.object({ email, password: z.string().min(1, { error: "Enter your password." }) });

export const InviteSchema = z.object({
  email,
  role: z.enum(["admin", "tech"], { error: "Choose a role." }),
});

export const CompanySchema = z.object({
  name: z.string().trim().min(2, { error: "Enter the business name." }).max(120),
  phone: z.string().trim().max(40),
  email: z.union([z.literal(""), email]),
  address: z.string().trim().max(300),
  license: z.string().trim().max(80),
  logoUrl: z.union([z.literal(""), z.url({ protocol: /^https$/, error: "Logo link must start with https://" })]),
  terms: z.string().trim().max(2000),
  payNote: z.string().trim().max(300),
  taxRate: z.coerce.number({ error: "Tax must be a number." }).min(0).max(30),
  reviewLink: z.union([z.literal(""), z.url({ protocol: /^https$/, error: "Review link must start with https://" })]),
  trades: z.array(z.enum(TRADE_KEYS as [string, ...string[]])).min(1, { error: "Keep at least one trade on." }),
});

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Check the form and try again.";
}
