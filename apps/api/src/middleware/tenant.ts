import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/client.ts";
import { organizations } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";
import { cacheGet, cacheSet } from "../lib/redis.ts";

// Validates that the authenticated user's organization is active
// and attaches the org to context for downstream use
export const tenantGuard = createMiddleware(async (c: Context, next: Next) => {
  const user = c.get("user");
  if (!user) return next();

  const cacheKey = `org:${user.organizationId}`;
  let org = await cacheGet<{ status: string; plan: string }>(cacheKey);

  if (!org) {
    const [found] = await db
      .select({ status: organizations.status, plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);

    if (!found) throw new HTTPException(403, { message: "Organization not found" });
    org = found;
    await cacheSet(cacheKey, org, 120);
  }

  if (org.status !== "active") {
    throw new HTTPException(403, { message: `Organization is ${org.status}` });
  }

  return next();
});
