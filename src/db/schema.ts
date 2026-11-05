import { pgTable, uuid, text, timestamp, integer, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import type { Role, Trade } from "@/lib/config";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/** A subscribing business (a tenant). Every business record hangs off a company. */
export const companies = pgTable("companies", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  license: text("license").notNull().default(""),
  logoUrl: text("logo_url").notNull().default(""),
  terms: text("terms").notNull().default("Payment due on receipt. Thank you for your business."),
  payNote: text("pay_note").notNull().default(""),
  /** Sales tax in basis points: 825 = 8.25% */
  taxRateBps: integer("tax_rate_bps").notNull().default(0),
  reviewLink: text("review_link").notNull().default(""),
  trades: jsonb("trades").$type<Trade[]>().notNull().default([]),
  plan: text("plan").notNull().default("trial"),
  /** trialing | active | past_due | canceled — driven by billing in a later step */
  status: text("status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<Role>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("memberships_company_user_idx").on(t.companyId, t.userId), index("memberships_user_idx").on(t.userId)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the cookie token; the raw token is never stored. */
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const invites = pgTable(
  "invites",
  {
    id: id(),
    companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<Role>().notNull(),
    /** SHA-256 of the invite token. */
    tokenHash: text("token_hash").notNull(),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("invites_token_idx").on(t.tokenHash), index("invites_company_idx").on(t.companyId)],
);

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
