import { Hono } from "hono";
import * as emailService from "../services/email.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit, aiRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit);

router.get("/accounts", async (c) => {
  const user = c.get("user");
  const accounts = await emailService.listEmailAccounts(user.organizationId, user.userId);
  return c.json({ success: true, data: accounts });
});

router.post("/accounts/connect", auditLog("email.account.connect", "email_account"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const account = await emailService.connectEmailAccount(user.organizationId, user.userId, body);
  return c.json({ success: true, data: account }, 201);
});

router.delete("/accounts/:id", auditLog("email.account.disconnect", "email_account"), async (c) => {
  const user = c.get("user");
  await emailService.disconnectEmailAccount(c.req.param("id"), user.organizationId, user.userId);
  return c.json({ success: true });
});

router.get("/threads", async (c) => {
  const user = c.get("user");
  const { page, limit } = c.req.query();
  const result = await emailService.listEmailThreads(user.organizationId, { page: parseInt(page ?? "1"), limit: parseInt(limit ?? "20") });
  return c.json({ success: true, ...result });
});

router.get("/threads/:id", async (c) => {
  const user = c.get("user");
  const thread = await emailService.getEmailThread(c.req.param("id"), user.organizationId);
  if (!thread) return c.json({ success: false, error: "Thread not found" }, 404);
  return c.json({ success: true, data: thread });
});

router.get("/drafts", async (c) => {
  const user = c.get("user");
  const drafts = await emailService.listEmailDrafts(user.organizationId);
  return c.json({ success: true, data: drafts });
});

router.post("/drafts/generate", aiRateLimit, async (c) => {
  const user = c.get("user");
  const { twinId, threadContext, recipient, tone, subject } = await c.req.json();
  if (!twinId || !threadContext || !recipient) {
    return c.json({ success: false, error: "twinId, threadContext, and recipient are required" }, 400);
  }
  const draft = await emailService.generateEmailDraft(user.organizationId, twinId, { threadContext, recipient, tone: tone ?? "professional", subject });
  return c.json({ success: true, data: draft }, 201);
});

router.put("/drafts/:id/approve", auditLog("email.draft.approve", "email_draft"), async (c) => {
  const user = c.get("user");
  const draft = await emailService.approveDraft(c.req.param("id"), user.organizationId, user.userId);
  return c.json({ success: true, data: draft });
});

router.post("/drafts/:id/send", auditLog("email.draft.send", "email_draft"), async (c) => {
  const user = c.get("user");
  const result = await emailService.sendDraft(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: result });
});

export default router;
