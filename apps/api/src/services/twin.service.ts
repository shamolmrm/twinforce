import { db } from "../db/client.ts";
import { aiTwins, twinMemories, twinInteractions, twinTrainingJobs } from "../db/schema/index.ts";
import { eq, and, desc, count } from "drizzle-orm";
import { publish } from "../lib/nats.ts";
import { logger } from "../lib/logger.ts";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function listTwins(orgId: string) {
  return db.select().from(aiTwins).where(eq(aiTwins.organizationId, orgId)).orderBy(desc(aiTwins.createdAt));
}

export async function getTwinById(id: string, orgId: string) {
  const [twin] = await db.select().from(aiTwins).where(and(eq(aiTwins.id, id), eq(aiTwins.organizationId, orgId))).limit(1);
  return twin ?? null;
}

export async function createTwin(orgId: string, userId: string, name: string, personalityConfig: unknown = {}) {
  const existing = await db.select({ id: aiTwins.id }).from(aiTwins).where(eq(aiTwins.userId, userId)).limit(1);
  if (existing.length > 0) throw new Error("User already has an AI twin");

  const [twin] = await db.insert(aiTwins).values({
    organizationId: orgId,
    userId,
    name,
    personalityConfig: personalityConfig as any,
    status: "pending",
  }).returning();

  await publish("twin.created", { twinId: twin.id, orgId, userId });
  return twin;
}

export async function updateTwin(id: string, orgId: string, data: Partial<{ name: string; toneSettings: unknown; personalityConfig: unknown; settings: unknown; isActive: boolean }>) {
  const [updated] = await db.update(aiTwins).set(data as any).where(
    and(eq(aiTwins.id, id), eq(aiTwins.organizationId, orgId)),
  ).returning();
  if (!updated) throw new Error("Twin not found");
  return updated;
}

export async function deleteTwin(id: string, orgId: string) {
  const [deleted] = await db.delete(aiTwins).where(
    and(eq(aiTwins.id, id), eq(aiTwins.organizationId, orgId)),
  ).returning({ id: aiTwins.id });
  if (!deleted) throw new Error("Twin not found");
}

export async function startTraining(twinId: string, orgId: string, dataSources: unknown[]) {
  const [twin] = await db.select().from(aiTwins).where(and(eq(aiTwins.id, twinId), eq(aiTwins.organizationId, orgId))).limit(1);
  if (!twin) throw new Error("Twin not found");

  const [job] = await db.insert(twinTrainingJobs).values({
    twinId,
    organizationId: orgId,
    status: "queued",
    dataSources: dataSources as any,
    startedAt: new Date(),
  }).returning();

  await db.update(aiTwins).set({ status: "training", trainingProgress: 0 }).where(eq(aiTwins.id, twinId));
  await publish("twin.train", { jobId: job.id, twinId, orgId, dataSources });

  return job;
}

export async function getTrainingStatus(twinId: string, orgId: string) {
  const [job] = await db.select().from(twinTrainingJobs)
    .where(and(eq(twinTrainingJobs.twinId, twinId), eq(twinTrainingJobs.organizationId, orgId)))
    .orderBy(desc(twinTrainingJobs.createdAt))
    .limit(1);

  const [twin] = await db.select({ status: aiTwins.status, trainingProgress: aiTwins.trainingProgress, confidenceScore: aiTwins.confidenceScore })
    .from(aiTwins).where(eq(aiTwins.id, twinId)).limit(1);

  return { job: job ?? null, twin: twin ?? null };
}

export async function chatWithTwin(twinId: string, orgId: string, userId: string, message: string, conversationHistory: unknown[] = []) {
  const [twin] = await db.select().from(aiTwins).where(and(eq(aiTwins.id, twinId), eq(aiTwins.organizationId, orgId))).limit(1);
  if (!twin || !twin.isActive) throw new Error("Twin not found or inactive");

  const startTs = Date.now();
  const res = await fetch(`${AI_SERVICE_URL}/ai/twin/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": process.env.AI_SERVICE_API_KEY ?? "" },
    body: JSON.stringify({ twin_id: twinId, org_id: orgId, message, conversation_history: conversationHistory }),
  });

  if (!res.ok) throw new Error("AI service error");
  const aiResponse = await res.json() as { response: string; confidence_score: number; sources: string[] };

  const responseTimeMs = Date.now() - startTs;

  await Promise.all([
    db.insert(twinInteractions).values({
      twinId,
      userId,
      interactionType: "chat",
      inputText: message,
      outputText: aiResponse.response,
      confidenceScore: String(aiResponse.confidence_score) as any,
      responseTimeMs,
    }),
    db.update(aiTwins).set({ totalInteractions: (twin.totalInteractions ?? 0) + 1 }).where(eq(aiTwins.id, twinId)),
  ]);

  return aiResponse;
}

export async function simulateTwin(twinId: string, orgId: string, scenario: string, context: unknown) {
  const res = await fetch(`${AI_SERVICE_URL}/ai/twin/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": process.env.AI_SERVICE_API_KEY ?? "" },
    body: JSON.stringify({ twin_id: twinId, org_id: orgId, scenario, context }),
  });
  if (!res.ok) throw new Error("AI service error");
  return res.json();
}

export async function getTwinInteractions(twinId: string, orgId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(twinInteractions).where(eq(twinInteractions.twinId, twinId)).orderBy(desc(twinInteractions.createdAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(twinInteractions).where(eq(twinInteractions.twinId, twinId)),
  ]);
  return { data: rows, total: Number(total), page, limit };
}

export async function getTwinMemories(twinId: string, orgId: string) {
  return db.select().from(twinMemories).where(and(eq(twinMemories.twinId, twinId), eq(twinMemories.organizationId, orgId))).orderBy(desc(twinMemories.createdAt)).limit(50);
}

export async function updateTwinTone(twinId: string, orgId: string, toneSettings: unknown) {
  return updateTwin(twinId, orgId, { toneSettings });
}

export async function getTwinAnalytics(twinId: string, orgId: string) {
  const [twin] = await db.select().from(aiTwins).where(and(eq(aiTwins.id, twinId), eq(aiTwins.organizationId, orgId))).limit(1);
  if (!twin) throw new Error("Twin not found");

  const [{ value: totalInteractions }] = await db.select({ value: count() }).from(twinInteractions).where(eq(twinInteractions.twinId, twinId));
  const [{ value: totalMemories }] = await db.select({ value: count() }).from(twinMemories).where(eq(twinMemories.twinId, twinId));

  return {
    twinId,
    totalInteractions: Number(totalInteractions),
    totalMemories: Number(totalMemories),
    confidenceScore: twin.confidenceScore,
    trainingProgress: twin.trainingProgress,
    lastTrainedAt: twin.lastTrainedAt,
    status: twin.status,
  };
}
