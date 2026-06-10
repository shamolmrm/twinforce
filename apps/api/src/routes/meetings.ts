import { Hono } from "hono";
import { z } from "zod";
import * as meetingService from "../services/meeting.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit);

const createMeetingSchema = z.object({
  title: z.string().min(1).max(500),
  platform: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime().optional(),
  externalMeetingId: z.string().optional(),
});

router.get("/", async (c) => {
  const user = c.get("user");
  const { page, limit, status } = c.req.query();
  const result = await meetingService.listMeetings(user.organizationId, { page: parseInt(page ?? "1"), limit: parseInt(limit ?? "20"), status });
  return c.json({ success: true, ...result });
});

router.get("/:id", async (c) => {
  const user = c.get("user");
  const meeting = await meetingService.getMeetingById(c.req.param("id"), user.organizationId);
  if (!meeting) return c.json({ success: false, error: "Meeting not found" }, 404);
  return c.json({ success: true, data: meeting });
});

router.post("/", auditLog("meeting.create", "meeting"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = createMeetingSchema.parse(body);
  const meeting = await meetingService.createMeeting(user.organizationId, user.userId, { ...data, scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined });
  return c.json({ success: true, data: meeting }, 201);
});

router.put("/:id", auditLog("meeting.update", "meeting"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const meeting = await meetingService.updateMeeting(c.req.param("id"), user.organizationId, body);
  return c.json({ success: true, data: meeting });
});

router.delete("/:id", auditLog("meeting.delete", "meeting"), async (c) => {
  const user = c.get("user");
  await meetingService.deleteMeeting(c.req.param("id"), user.organizationId);
  return c.json({ success: true });
});

router.post("/:id/join", async (c) => {
  const user = c.get("user");
  const result = await meetingService.joinMeeting(c.req.param("id"), user.organizationId, user.userId);
  return c.json({ success: true, data: result });
});

router.post("/:id/end", auditLog("meeting.end", "meeting"), async (c) => {
  const user = c.get("user");
  const meeting = await meetingService.endMeeting(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: meeting });
});

router.get("/:id/transcript", async (c) => {
  const user = c.get("user");
  const data = await meetingService.getMeetingTranscript(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data });
});

router.get("/:id/summary", async (c) => {
  const user = c.get("user");
  const data = await meetingService.getMeetingSummary(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data });
});

router.get("/:id/action-items", async (c) => {
  const user = c.get("user");
  const items = await meetingService.getActionItems(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: items });
});

router.post("/:id/action-items", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const item = await meetingService.createActionItem(c.req.param("id"), user.organizationId, body);
  return c.json({ success: true, data: item }, 201);
});

router.get("/:id/notes", async (c) => {
  const user = c.get("user");
  const notes = await meetingService.getMeetingNotes(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: notes });
});

export default router;
