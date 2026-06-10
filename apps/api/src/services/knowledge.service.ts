import { db } from "../db/client.ts";
import { knowledgeSources, knowledgeDocuments, knowledgeChunks } from "../db/schema/index.ts";
import { eq, and, desc, count } from "drizzle-orm";
import { uploadFile } from "../lib/minio.ts";
import { publish } from "../lib/nats.ts";
import { randomUUID } from "crypto";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function listSources(orgId: string) {
  return db.select().from(knowledgeSources).where(eq(knowledgeSources.organizationId, orgId)).orderBy(desc(knowledgeSources.createdAt));
}

export async function createSource(orgId: string, userId: string, data: { name: string; sourceType: string; connectionConfig?: unknown }) {
  const [source] = await db.insert(knowledgeSources).values({
    organizationId: orgId,
    createdBy: userId,
    name: data.name,
    sourceType: data.sourceType,
    connectionConfig: data.connectionConfig as any ?? {},
  }).returning();
  return source;
}

export async function deleteSource(id: string, orgId: string) {
  const [deleted] = await db.delete(knowledgeSources).where(and(eq(knowledgeSources.id, id), eq(knowledgeSources.organizationId, orgId))).returning({ id: knowledgeSources.id });
  if (!deleted) throw new Error("Source not found");
}

export async function syncSource(id: string, orgId: string) {
  const [source] = await db.select().from(knowledgeSources).where(and(eq(knowledgeSources.id, id), eq(knowledgeSources.organizationId, orgId))).limit(1);
  if (!source) throw new Error("Source not found");

  await db.update(knowledgeSources).set({ syncStatus: "syncing" }).where(eq(knowledgeSources.id, id));
  await publish("knowledge.sync", { sourceId: id, orgId });
  return { status: "syncing" };
}

export async function listDocuments(orgId: string, opts: { page?: number; limit?: number } = {}) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.organizationId, orgId)).orderBy(desc(knowledgeDocuments.createdAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(knowledgeDocuments).where(eq(knowledgeDocuments.organizationId, orgId)),
  ]);
  return { data: rows, total: Number(total), page, limit };
}

export async function uploadDocument(orgId: string, userId: string, file: File, metadata: { title?: string } = {}) {
  // Find or create a "manual upload" source
  let [source] = await db.select().from(knowledgeSources).where(and(eq(knowledgeSources.organizationId, orgId), eq(knowledgeSources.sourceType, "upload"))).limit(1);
  if (!source) {
    [source] = await db.insert(knowledgeSources).values({
      organizationId: orgId,
      createdBy: userId,
      name: "Manual Uploads",
      sourceType: "upload",
    }).returning();
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectName = `${orgId}/documents/${randomUUID()}-${file.name}`;
  const fileUrl = await uploadFile(objectName, buffer, file.type);

  const [doc] = await db.insert(knowledgeDocuments).values({
    organizationId: orgId,
    sourceId: source.id,
    title: metadata.title ?? file.name,
    fileUrl,
    fileType: file.type,
    fileSizeBytes: file.size,
    isIndexed: false,
  }).returning();

  await publish("knowledge.index", { documentId: doc.id, orgId });
  return doc;
}

export async function deleteDocument(id: string, orgId: string) {
  const [deleted] = await db.delete(knowledgeDocuments).where(and(eq(knowledgeDocuments.id, id), eq(knowledgeDocuments.organizationId, orgId))).returning({ id: knowledgeDocuments.id });
  if (!deleted) throw new Error("Document not found");
}

export async function searchKnowledge(orgId: string, query: string, filters: unknown = {}, topK = 10) {
  const res = await fetch(`${AI_SERVICE_URL}/ai/rag/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": process.env.AI_SERVICE_API_KEY ?? "" },
    body: JSON.stringify({ query, organization_id: orgId, filters, top_k: topK }),
  });
  if (!res.ok) throw new Error("AI service error");
  return res.json();
}

export async function askKnowledge(orgId: string, question: string, twinId?: string) {
  const res = await fetch(`${AI_SERVICE_URL}/ai/rag/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": process.env.AI_SERVICE_API_KEY ?? "" },
    body: JSON.stringify({ question, organization_id: orgId, twin_id: twinId }),
  });
  if (!res.ok) throw new Error("AI service error");
  return res.json();
}
