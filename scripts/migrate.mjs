// Applies pending migrations to the production database. Skips when no database is configured.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) {
  console.log("migrate: no DATABASE_URL set, skipping.");
  process.exit(0);
}
const client = postgres(url, { max: 1, prepare: false });
await migrate(drizzle(client), { migrationsFolder: "drizzle" });
await client.end();
console.log("migrate: database is up to date.");
