import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.ts";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for serverless environments; use max=10 pool for long-running server
const client = postgres(connectionString, { max: 10, idle_timeout: 30 });

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV !== "production" });

export type DB = typeof db;
