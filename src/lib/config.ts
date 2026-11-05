// Product-wide settings. Change the name here once it's decided.
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Field Service App";

export const TRIAL_DAYS = 14;

export const TRADES = {
  appliance: "Appliance repair",
  hvac: "HVAC",
  handyman: "Handyman",
  plumbing: "Plumbing",
} as const;
export type Trade = keyof typeof TRADES;
export const TRADE_KEYS = Object.keys(TRADES) as Trade[];

export const ROLES = {
  owner: "Owner",
  admin: "Office admin",
  tech: "Technician",
} as const;
export type Role = keyof typeof ROLES;

export const SESSION_COOKIE = "fsa_session";
export const SESSION_DAYS = 30;
export const INVITE_DAYS = 7;

/** Emails allowed into /admin (the platform owner's panel). Comma-separated env var. */
export function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
