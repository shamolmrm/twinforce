import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { db } from "../db/client.ts";
import { auditLogs } from "../db/schema/index.ts";
import { logger } from "../lib/logger.ts";

export function auditLog(action: string, resourceType?: string) {
  return createMiddleware(async (c: Context, next: Next) => {
    const start = Date.now();
    const user = c.get("user");
    const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";
    const userAgent = c.req.header("user-agent");

    let resourceId: string | undefined;
    try {
      resourceId = c.req.param("id");
    } catch {}

    await next();

    const durationMs = Date.now() - start;
    const status = c.res.status < 400 ? "success" : "failure";

    // Fire-and-forget — don't block response
    db.insert(auditLogs)
      .values({
        organizationId: user?.organizationId,
        userId: user?.userId,
        action,
        resourceType,
        resourceId: resourceId as any,
        ipAddress: ip as any,
        userAgent,
        status,
        durationMs,
      })
      .catch((err: unknown) => logger.error({ err }, "Audit log insert failed"));
  });
}
