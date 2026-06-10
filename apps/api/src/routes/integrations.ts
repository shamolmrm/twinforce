import { Hono } from "hono";
import * as integrationService from "../services/integration.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { requireOwnerOrAdmin } from "../middleware/rbac.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit);

router.get("/", async (c) => {
  const user = c.get("user");
  const data = await integrationService.listIntegrations(user.organizationId);
  return c.json({ success: true, data });
});

router.post("/", requireOwnerOrAdmin(), auditLog("integration.create", "integration"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const integration = await integrationService.createIntegration(user.organizationId, user.userId, body);
  return c.json({ success: true, data: integration }, 201);
});

router.put("/:id", requireOwnerOrAdmin(), auditLog("integration.update", "integration"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const integration = await integrationService.updateIntegration(c.req.param("id"), user.organizationId, body);
  return c.json({ success: true, data: integration });
});

router.delete("/:id", requireOwnerOrAdmin(), auditLog("integration.delete", "integration"), async (c) => {
  const user = c.get("user");
  await integrationService.deleteIntegration(c.req.param("id"), user.organizationId);
  return c.json({ success: true });
});

router.post("/:id/sync", async (c) => {
  const user = c.get("user");
  const result = await integrationService.syncIntegration(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: result });
});

export default router;
