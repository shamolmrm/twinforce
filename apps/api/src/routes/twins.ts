import { Hono } from "hono";
import { z } from "zod";
import * as twinService from "../services/twin.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit, aiRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit);

const createTwinSchema = z.object({
  name: z.string().min(1).max(255),
  personalityConfig: z.record(z.unknown()).optional(),
});

const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationHistory: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

router.get("/", async (c) => {
  const user = c.get("user");
  const twins = await twinService.listTwins(user.organizationId);
  return c.json({ success: true, data: twins });
});

router.get("/:id", async (c) => {
  const user = c.get("user");
  const twin = await twinService.getTwinById(c.req.param("id"), user.organizationId);
  if (!twin) return c.json({ success: false, error: "Twin not found" }, 404);
  return c.json({ success: true, data: twin });
});

router.post("/", auditLog("twin.create", "twin"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { name, personalityConfig } = createTwinSchema.parse(body);
  const twin = await twinService.createTwin(user.organizationId, user.userId, name, personalityConfig);
  return c.json({ success: true, data: twin }, 201);
});

router.put("/:id", auditLog("twin.update", "twin"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const twin = await twinService.updateTwin(c.req.param("id"), user.organizationId, body);
  return c.json({ success: true, data: twin });
});

router.delete("/:id", auditLog("twin.delete", "twin"), async (c) => {
  const user = c.get("user");
  await twinService.deleteTwin(c.req.param("id"), user.organizationId);
  return c.json({ success: true });
});

router.post("/:id/train", aiRateLimit, auditLog("twin.train", "twin"), async (c) => {
  const user = c.get("user");
  const { dataSources } = await c.req.json();
  const job = await twinService.startTraining(c.req.param("id"), user.organizationId, dataSources ?? []);
  return c.json({ success: true, data: job }, 202);
});

router.get("/:id/training-status", async (c) => {
  const user = c.get("user");
  const status = await twinService.getTrainingStatus(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: status });
});

router.post("/:id/chat", aiRateLimit, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { message, conversationHistory } = chatSchema.parse(body);
  const response = await twinService.chatWithTwin(c.req.param("id"), user.organizationId, user.userId, message, conversationHistory);
  return c.json({ success: true, data: response });
});

router.get("/:id/interactions", async (c) => {
  const user = c.get("user");
  const { page, limit } = c.req.query();
  const result = await twinService.getTwinInteractions(c.req.param("id"), user.organizationId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  return c.json({ success: true, ...result });
});

router.get("/:id/memories", async (c) => {
  const user = c.get("user");
  const memories = await twinService.getTwinMemories(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: memories });
});

router.post("/:id/simulate", aiRateLimit, async (c) => {
  const user = c.get("user");
  const { scenario, context } = await c.req.json();
  const result = await twinService.simulateTwin(c.req.param("id"), user.organizationId, scenario, context);
  return c.json({ success: true, data: result });
});

router.put("/:id/tone", auditLog("twin.tone.update", "twin"), async (c) => {
  const user = c.get("user");
  const { toneSettings } = await c.req.json();
  const twin = await twinService.updateTwinTone(c.req.param("id"), user.organizationId, toneSettings);
  return c.json({ success: true, data: twin });
});

router.get("/:id/analytics", async (c) => {
  const user = c.get("user");
  const analytics = await twinService.getTwinAnalytics(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: analytics });
});

export default router;
