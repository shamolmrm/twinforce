import { db } from "../db/client.ts";
import { integrations } from "../db/schema/index.ts";
import { eq, and, desc } from "drizzle-orm";
import { encrypt, decrypt } from "../lib/crypto.ts";
import { publish } from "../lib/nats.ts";

export async function listIntegrations(orgId: string) {
  return db.select({
    id: integrations.id,
    integrationType: integrations.integrationType,
    name: integrations.name,
    config: integrations.config,
    status: integrations.status,
    lastSyncAt: integrations.lastSyncAt,
    errorMessage: integrations.errorMessage,
    createdAt: integrations.createdAt,
  }).from(integrations).where(eq(integrations.organizationId, orgId)).orderBy(desc(integrations.createdAt));
}

export async function createIntegration(orgId: string, userId: string, data: { integrationType: string; name: string; config?: unknown; credentials?: string }) {
  const [integration] = await db.insert(integrations).values({
    organizationId: orgId,
    createdBy: userId,
    integrationType: data.integrationType,
    name: data.name,
    config: data.config as any ?? {},
    credentialsEncrypted: data.credentials ? encrypt(data.credentials) : null,
    status: "inactive",
  }).returning();
  return integration;
}

export async function updateIntegration(id: string, orgId: string, data: Partial<{ name: string; config: unknown; status: string }>) {
  const [updated] = await db.update(integrations).set(data as any).where(and(eq(integrations.id, id), eq(integrations.organizationId, orgId))).returning();
  if (!updated) throw new Error("Integration not found");
  return updated;
}

export async function deleteIntegration(id: string, orgId: string) {
  const [deleted] = await db.delete(integrations).where(and(eq(integrations.id, id), eq(integrations.organizationId, orgId))).returning({ id: integrations.id });
  if (!deleted) throw new Error("Integration not found");
}

export async function syncIntegration(id: string, orgId: string) {
  await publish("integration.sync", { integrationId: id, orgId });
  await db.update(integrations).set({ status: "syncing" }).where(eq(integrations.id, id));
  return { status: "syncing" };
}
