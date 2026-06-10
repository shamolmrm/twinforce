import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.ts";
import { requireOwnerOrAdmin } from "../middleware/rbac.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";
import { db } from "../db/client.ts";
import { webhooks } from "../db/schema/index.ts";
import { eq, and } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit, requireOwnerOrAdmin());

router.get("/", async (c) => {
  const user = c.get("user");
  const data = await db.select({ id: webhooks.id, url: webhooks.url, events: webhooks.events, isActive: webhooks.isActive, failureCount: webhooks.failureCount, lastTriggeredAt: webhooks.lastTriggeredAt, createdAt: webhooks.createdAt }).from(webhooks).where(eq(webhooks.organizationId, user.organizationId));
  return c.json({ success: true, data });
});

router.post("/", async (c) => {
  const user = c.get("user");
  const { url, events } = await c.req.json();
  if (!url || !events?.length) return c.json({ success: false, error: "url and events required" }, 400);
  const secret = randomBytes(32).toString("hex");
  const secretHash = createHash("sha256").update(secret).digest("hex");
  const [webhook] = await db.insert(webhooks).values({
    organizationId: user.organizationId,
    url,
    events,
    secretHash,
    isActive: true,
  }).returning({ id: webhooks.id, url: webhooks.url });
  return c.json({ success: true, data: { ...webhook, secret } }, 201);
});

router.delete("/:id", async (c) => {
  const user = c.get("user");
  const [deleted] = await db.delete(webhooks).where(and(eq(webhooks.id, c.req.param("id")), eq(webhooks.organizationId, user.organizationId))).returning({ id: webhooks.id });
  if (!deleted) return c.json({ success: false, error: "Webhook not found" }, 404);
  return c.json({ success: true });
});

export default router;
