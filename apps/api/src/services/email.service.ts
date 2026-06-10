import { db } from "../db/client.ts";
import { emailAccounts, emailThreads, emailDrafts } from "../db/schema/index.ts";
import { eq, and, desc, count } from "drizzle-orm";
import { encrypt, decrypt } from "../lib/crypto.ts";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function listEmailAccounts(orgId: string, userId: string) {
  return db.select({
    id: emailAccounts.id,
    emailAddress: emailAccounts.emailAddress,
    provider: emailAccounts.provider,
    syncStatus: emailAccounts.syncStatus,
    lastSyncedAt: emailAccounts.lastSyncedAt,
    totalEmailsProcessed: emailAccounts.totalEmailsProcessed,
    isActive: emailAccounts.isActive,
    createdAt: emailAccounts.createdAt,
  }).from(emailAccounts).where(and(eq(emailAccounts.organizationId, orgId), eq(emailAccounts.userId, userId)));
}

export async function connectEmailAccount(orgId: string, userId: string, data: { emailAddress: string; provider: string; accessToken: string; refreshToken?: string; tokenExpiresAt?: Date }) {
  const [account] = await db.insert(emailAccounts).values({
    organizationId: orgId,
    userId,
    emailAddress: data.emailAddress,
    provider: data.provider,
    accessTokenEncrypted: encrypt(data.accessToken),
    refreshTokenEncrypted: data.refreshToken ? encrypt(data.refreshToken) : null,
    tokenExpiresAt: data.tokenExpiresAt ?? null,
    syncStatus: "pending",
  }).returning();
  return account;
}

export async function disconnectEmailAccount(id: string, orgId: string, userId: string) {
  const [deleted] = await db.delete(emailAccounts).where(and(eq(emailAccounts.id, id), eq(emailAccounts.organizationId, orgId), eq(emailAccounts.userId, userId))).returning({ id: emailAccounts.id });
  if (!deleted) throw new Error("Account not found");
}

export async function listEmailThreads(orgId: string, opts: { page?: number; limit?: number } = {}) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(emailThreads).where(eq(emailThreads.organizationId, orgId)).orderBy(desc(emailThreads.lastMessageAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(emailThreads).where(eq(emailThreads.organizationId, orgId)),
  ]);
  return { data: rows, total: Number(total), page, limit };
}

export async function getEmailThread(id: string, orgId: string) {
  const [thread] = await db.select().from(emailThreads).where(and(eq(emailThreads.id, id), eq(emailThreads.organizationId, orgId))).limit(1);
  return thread ?? null;
}

export async function listEmailDrafts(orgId: string) {
  return db.select().from(emailDrafts).where(and(eq(emailDrafts.organizationId, orgId))).orderBy(desc(emailDrafts.createdAt)).limit(50);
}

export async function generateEmailDraft(orgId: string, twinId: string, data: { threadContext: string; recipient: string; tone: string; subject?: string }) {
  const res = await fetch(`${AI_SERVICE_URL}/ai/twin/draft-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": process.env.AI_SERVICE_API_KEY ?? "" },
    body: JSON.stringify({ twin_id: twinId, org_id: orgId, ...data }),
  });
  if (!res.ok) throw new Error("AI service error");
  const aiDraft = await res.json() as { subject: string; body: string; confidence_score: number };

  const [draft] = await db.insert(emailDrafts).values({
    organizationId: orgId,
    twinId,
    subject: aiDraft.subject,
    body: aiDraft.body,
    tone: data.tone,
    toAddresses: [data.recipient] as any,
    confidenceScore: String(aiDraft.confidence_score) as any,
    status: "draft",
  }).returning();
  return draft;
}

export async function approveDraft(id: string, orgId: string, approvedBy: string) {
  const [updated] = await db.update(emailDrafts).set({ status: "approved", approvedBy }).where(and(eq(emailDrafts.id, id), eq(emailDrafts.organizationId, orgId))).returning();
  if (!updated) throw new Error("Draft not found");
  return updated;
}

export async function sendDraft(id: string, orgId: string) {
  const [draft] = await db.select().from(emailDrafts).where(and(eq(emailDrafts.id, id), eq(emailDrafts.organizationId, orgId))).limit(1);
  if (!draft) throw new Error("Draft not found");
  if (draft.status !== "approved") throw new Error("Draft must be approved before sending");

  await db.update(emailDrafts).set({ status: "sent", sentAt: new Date() }).where(eq(emailDrafts.id, id));
  return { sent: true };
}
