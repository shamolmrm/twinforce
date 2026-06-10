import { db } from "../db/client.ts";
import { analyticsSnapshots, users, aiTwins, meetings, twinInteractions, usageRecords } from "../db/schema/index.ts";
import { eq, and, gte, lte, desc, count, sum } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function getDashboardStats(orgId: string) {
  const [
    [{ value: totalUsers }],
    [{ value: activeTwins }],
    [{ value: totalMeetings }],
    [{ value: totalInteractions }],
  ] = await Promise.all([
    db.select({ value: count() }).from(users).where(and(eq(users.organizationId, orgId), eq(users.status, "active"))),
    db.select({ value: count() }).from(aiTwins).where(and(eq(aiTwins.organizationId, orgId), eq(aiTwins.isActive, true))),
    db.select({ value: count() }).from(meetings).where(eq(meetings.organizationId, orgId)),
    db.select({ value: count() }).from(twinInteractions).where(
      sql`twin_id IN (SELECT id FROM ai_twins WHERE organization_id = ${orgId})`
    ),
  ]);

  const recent = await db.select().from(analyticsSnapshots).where(eq(analyticsSnapshots.organizationId, orgId)).orderBy(desc(analyticsSnapshots.snapshotDate)).limit(30);

  return {
    totalUsers: Number(totalUsers),
    activeTwins: Number(activeTwins),
    totalMeetings: Number(totalMeetings),
    totalInteractions: Number(totalInteractions),
    recentSnapshots: recent,
  };
}

export async function getTwinAnalyticsSummary(orgId: string) {
  const twins = await db.select({
    id: aiTwins.id,
    name: aiTwins.name,
    totalInteractions: aiTwins.totalInteractions,
    confidenceScore: aiTwins.confidenceScore,
    status: aiTwins.status,
    trainingProgress: aiTwins.trainingProgress,
  }).from(aiTwins).where(eq(aiTwins.organizationId, orgId));
  return twins;
}

export async function getMeetingAnalytics(orgId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await db.select().from(meetings).where(
    and(eq(meetings.organizationId, orgId), gte(meetings.createdAt, since))
  ).orderBy(desc(meetings.createdAt));

  const byStatus = rows.reduce((acc, m) => {
    acc[m.status ?? "unknown"] = (acc[m.status ?? "unknown"] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalDuration = rows.reduce((acc, m) => acc + (m.durationMinutes ?? 0), 0);

  return { total: rows.length, byStatus, totalDurationMinutes: totalDuration, meetings: rows.slice(0, 10) };
}

export async function getProductivityMetrics(orgId: string) {
  const [recent] = await db.select().from(analyticsSnapshots).where(eq(analyticsSnapshots.organizationId, orgId)).orderBy(desc(analyticsSnapshots.snapshotDate)).limit(1);
  return {
    hoursSaved: recent?.hoursSaved ?? 0,
    tasksAutomated: recent?.tasksAutomated ?? 0,
    knowledgeQueries: recent?.knowledgeQueries ?? 0,
    emailsProcessed: recent?.emailsProcessed ?? 0,
  };
}

export async function getUsageStats(orgId: string) {
  const rows = await db.select({
    usageType: usageRecords.usageType,
    total: sum(usageRecords.quantity),
    totalCost: sum(usageRecords.costCents),
  }).from(usageRecords).where(
    and(eq(usageRecords.organizationId, orgId), gte(usageRecords.recordedAt, new Date(Date.now() - 30 * 86400000)))
  ).groupBy(usageRecords.usageType);
  return rows;
}

export async function getMRRData(orgId: string) {
  const snapshots = await db.select({ date: analyticsSnapshots.snapshotDate, mrr: analyticsSnapshots.mrrCents })
    .from(analyticsSnapshots)
    .where(eq(analyticsSnapshots.organizationId, orgId))
    .orderBy(analyticsSnapshots.snapshotDate)
    .limit(12);
  return snapshots;
}
