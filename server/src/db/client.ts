import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "../config";
import * as schema from "./schema";

// Neon (and any sslmode=require URL) needs SSL; local Docker Postgres does not.
// Cap the pool small for serverless so concurrent function invocations don't
// exhaust connections (use Neon's pooled endpoint for the same reason).
const useSsl = /neon\.tech|sslmode=require/.test(config.databaseUrl);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: useSsl ? 3 : 10,
});

export const db = drizzle(pool, { schema });
