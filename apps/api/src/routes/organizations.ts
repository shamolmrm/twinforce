import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.ts";
import { requireOwnerOrAdmin } from "../middleware/rbac.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";
import { db } from "../db/client.ts";
import { organizations, users } from "../db/schema/index.ts";
import { eq, and, count } from "drizzle-orm";
import * as analyticsService from "../services/analytics.service.ts";
import * as userService from "../services/user.service.ts";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit);

const updateOrgSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  domain: z.string().max(255).optional(),
  logoUrl: z.string().url().optional(),
  settings: z.record(z.unknown()).optional(),
});

router.get("/current", async (c) => {
  const user = c.get("user");
  const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
  if (!org) return c.json({ success: false, error: "Organization not found" }, 404);
  return c.json({ success: true, data: org });
});

router.put("/current", requireOwnerOrAdmin(), auditLog("org.update", "organization"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = updateOrgSchema.parse(body);
  const [updated] = await db.update(organizations).set(data as any).where(eq(organizations.id, user.organizationId)).returning();
  return c.json({ success: true, data: updated });
});

router.get("/current/members", async (c) => {
  const user = c.get("user");
  const { page, limit } = c.req.query();
  const result = await userService.listUsers(user.organizationId, {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
  return c.json({ success: true, ...result });
});

router.get("/current/stats", async (c) => {
  const user = c.get("user");
  const stats = await analyticsService.getDashboardStats(user.organizationId);
  return c.json({ success: true, data: stats });
});

router.post("/current/invite", requireOwnerOrAdmin(), async (c) => {
  const user = c.get("user");
  const { email, role } = await c.req.json();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
  const result = await userService.inviteUser(user.organizationId, user.userId, email, role ?? "employee", org.name, user.email);
  return c.json({ success: true, data: result }, 201);
});

export default router;
