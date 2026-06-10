import { Hono } from "hono";
import * as analyticsService from "../services/analytics.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { requireManager } from "../middleware/rbac.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit, requireManager());

router.get("/dashboard", async (c) => {
  const user = c.get("user");
  const stats = await analyticsService.getDashboardStats(user.organizationId);
  return c.json({ success: true, data: stats });
});

router.get("/twins", async (c) => {
  const user = c.get("user");
  const data = await analyticsService.getTwinAnalyticsSummary(user.organizationId);
  return c.json({ success: true, data });
});

router.get("/meetings", async (c) => {
  const user = c.get("user");
  const { days } = c.req.query();
  const data = await analyticsService.getMeetingAnalytics(user.organizationId, days ? parseInt(days) : 30);
  return c.json({ success: true, data });
});

router.get("/productivity", async (c) => {
  const user = c.get("user");
  const data = await analyticsService.getProductivityMetrics(user.organizationId);
  return c.json({ success: true, data });
});

router.get("/usage", async (c) => {
  const user = c.get("user");
  const data = await analyticsService.getUsageStats(user.organizationId);
  return c.json({ success: true, data });
});

router.get("/mrr", async (c) => {
  const user = c.get("user");
  const data = await analyticsService.getMRRData(user.organizationId);
  return c.json({ success: true, data });
});

export default router;
