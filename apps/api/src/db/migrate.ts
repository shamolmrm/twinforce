import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./client.ts";
import { logger } from "../lib/logger.ts";

logger.info("Running database migrations…");
await migrate(db, { migrationsFolder: "src/db/migrations" });
logger.info("Migrations complete.");
process.exit(0);
