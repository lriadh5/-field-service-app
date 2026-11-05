import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __fsaDb?: Promise<Db> };

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || "";
}

/**
 * Production: Postgres from DATABASE_URL (or Netlify DB's NETLIFY_DATABASE_URL).
 * Local development without a URL: an embedded PGlite database in .data/, migrated on start.
 */
export function getDb(): Promise<Db> {
  if (!g.__fsaDb) g.__fsaDb = connect();
  return g.__fsaDb;
}

async function connect(): Promise<Db> {
  const url = databaseUrl();
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { max: 5, prepare: false });
    return drizzle(client, { schema }) as unknown as Db;
  }
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_DB) {
    throw new Error("DATABASE_URL is not set. Connect a Postgres database (for example Netlify DB) before deploying.");
  }
  return createPgliteDb(process.env.PGLITE_DIR || ".data/pglite");
}

/** Embedded Postgres for local dev and tests. Pass "memory://" for a throwaway database. */
export async function createPgliteDb(dataDir: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  if (!dataDir.includes("://")) {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db as unknown as Db;
}
