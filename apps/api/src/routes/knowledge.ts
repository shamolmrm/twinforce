import { Hono } from "hono";
import * as knowledgeService from "../services/knowledge.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit, aiRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";

const router = new Hono();
router.use("*", requireAuth, tenantGuard, apiRateLimit);

router.get("/sources", async (c) => {
  const user = c.get("user");
  const sources = await knowledgeService.listSources(user.organizationId);
  return c.json({ success: true, data: sources });
});

router.post("/sources", auditLog("knowledge.source.create", "knowledge_source"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const source = await knowledgeService.createSource(user.organizationId, user.userId, body);
  return c.json({ success: true, data: source }, 201);
});

router.delete("/sources/:id", auditLog("knowledge.source.delete", "knowledge_source"), async (c) => {
  const user = c.get("user");
  await knowledgeService.deleteSource(c.req.param("id"), user.organizationId);
  return c.json({ success: true });
});

router.post("/sources/:id/sync", async (c) => {
  const user = c.get("user");
  const result = await knowledgeService.syncSource(c.req.param("id"), user.organizationId);
  return c.json({ success: true, data: result }, 202);
});

router.get("/documents", async (c) => {
  const user = c.get("user");
  const { page, limit } = c.req.query();
  const result = await knowledgeService.listDocuments(user.organizationId, { page: parseInt(page ?? "1"), limit: parseInt(limit ?? "20") });
  return c.json({ success: true, ...result });
});

router.post("/documents/upload", async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;
  if (!file) return c.json({ success: false, error: "file required" }, 400);
  const doc = await knowledgeService.uploadDocument(user.organizationId, user.userId, file, { title: title ?? undefined });
  return c.json({ success: true, data: doc }, 201);
});

router.delete("/documents/:id", auditLog("knowledge.document.delete", "knowledge_document"), async (c) => {
  const user = c.get("user");
  await knowledgeService.deleteDocument(c.req.param("id"), user.organizationId);
  return c.json({ success: true });
});

router.post("/search", aiRateLimit, async (c) => {
  const user = c.get("user");
  const { query, filters, topK } = await c.req.json();
  if (!query) return c.json({ success: false, error: "query required" }, 400);
  const results = await knowledgeService.searchKnowledge(user.organizationId, query, filters, topK ?? 10);
  return c.json({ success: true, data: results });
});

router.post("/ask", aiRateLimit, async (c) => {
  const user = c.get("user");
  const { question, twinId } = await c.req.json();
  if (!question) return c.json({ success: false, error: "question required" }, 400);
  const answer = await knowledgeService.askKnowledge(user.organizationId, question, twinId);
  return c.json({ success: true, data: answer });
});

export default router;
