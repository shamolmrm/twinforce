import { Hono } from "hono";
import * as notificationService from "../services/notification.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit);

router.get("/", async (c) => {
  const user = c.get("user");
  const { page, limit } = c.req.query();
  const result = await notificationService.listNotifications(user.userId, user.organizationId, { page: parseInt(page ?? "1"), limit: parseInt(limit ?? "20") });
  return c.json({ success: true, ...result });
});

router.put("/:id/read", async (c) => {
  const user = c.get("user");
  const result = await notificationService.markRead(c.req.param("id"), user.userId);
  return c.json({ success: true, data: result });
});

router.put("/read-all", async (c) => {
  const user = c.get("user");
  const result = await notificationService.markAllRead(user.userId, user.organizationId);
  return c.json({ success: true, data: result });
});

router.delete("/:id", async (c) => {
  const user = c.get("user");
  await notificationService.deleteNotification(c.req.param("id"), user.userId);
  return c.json({ success: true });
});

export default router;
