import { Hono } from "hono";
import { z } from "zod";
import * as userService from "../services/user.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { requireOwnerOrAdmin, requireManager } from "../middleware/rbac.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";
import { db } from "../db/client.ts";
import { auditLogs } from "../db/schema/index.ts";
import { eq, and, desc } from "drizzle-orm";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit);

const updateUserSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  department: z.string().max(100).optional(),
  jobTitle: z.string().max(150).optional(),
  avatarUrl: z.string().url().optional(),
  settings: z.record(z.unknown()).optional(),
});

router.get("/", requireManager(), async (c) => {
  const { page, limit, search } = c.req.query();
  const user = c.get("user");
  const result = await userService.listUsers(user.organizationId, {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
    search,
  });
  return c.json({ success: true, ...result });
});

router.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const target = await userService.getUserById(id === "me" ? user.userId : id, user.organizationId);
  if (!target) return c.json({ success: false, error: "User not found" }, 404);
  return c.json({ success: true, data: target });
});

router.put("/:id", auditLog("user.update", "user"), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const data = updateUserSchema.parse(body);

  if (id !== user.userId && user.role !== "owner" && user.role !== "admin") {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }

  const updated = await userService.updateUser(id, user.organizationId, data);
  return c.json({ success: true, data: updated });
});

router.delete("/:id", requireOwnerOrAdmin(), auditLog("user.delete", "user"), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  if (id === user.userId) return c.json({ success: false, error: "Cannot delete yourself" }, 400);
  await userService.deleteUser(id, user.organizationId);
  return c.json({ success: true });
});

router.post("/invite", requireOwnerOrAdmin(), auditLog("user.invite"), async (c) => {
  const user = c.get("user");
  const { email, role } = await c.req.json();
  if (!email) return c.json({ success: false, error: "email required" }, 400);
  const result = await userService.inviteUser(user.organizationId, user.userId, email, role ?? "employee", user.organizationId, user.email);
  return c.json({ success: true, data: result }, 201);
});

router.put("/:id/role", requireOwnerOrAdmin(), auditLog("user.role.update", "user"), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { role } = await c.req.json();
  if (!role) return c.json({ success: false, error: "role required" }, 400);
  await userService.updateUserRole(id, user.organizationId, role, user.userId);
  return c.json({ success: true });
});

router.get("/:id/activity", requireManager(), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const logs = await db.select().from(auditLogs).where(and(eq(auditLogs.userId, id), eq(auditLogs.organizationId, user.organizationId))).orderBy(desc(auditLogs.createdAt)).limit(50);
  return c.json({ success: true, data: logs });
});

export default router;
