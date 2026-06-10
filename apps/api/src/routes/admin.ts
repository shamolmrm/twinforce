import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";
import { db } from "../db/client.ts";
import {
  organizations, users, aiTwins, meetings,
  auditLogs, subscriptionPlans, subscriptions,
} from "../db/schema/index.ts";
import { desc, count, ne, eq, inArray, and, gte, sql, not } from "drizzle-orm";
import { z } from "zod";

const router = new Hono();

// ─── Guard: super_admin only ─────────────────────────────────────────────────
router.use("*", requireAuth, apiRateLimit, async (c, next) => {
  const user = c.get("user");
  if (user.role !== "super_admin") {
    return c.json({ success: false, error: "Super admin access required" }, 403);
  }
  return next();
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get("/dashboard", async (c) => {
  const [
    [{ totalOrgs }],
    [{ totalUsers }],
    [{ totalTwins }],
    [{ totalMeetings }],
    [{ activeSubCount }],
    recentOrgs,
    recentUsers,
    recentAudit,
    mrrRows,
  ] = await Promise.all([
    db.select({ totalOrgs: count() }).from(organizations).where(ne(organizations.plan, "system")),
    db.select({ totalUsers: count() }).from(users).where(ne(users.role, "super_admin")),
    db.select({ totalTwins: count() }).from(aiTwins),
    db.select({ totalMeetings: count() }).from(meetings),
    db.select({ activeSubCount: count() }).from(subscriptions)
      .where(inArray(subscriptions.status, ["active", "trialing"])),
    db.select({
      id: organizations.id,
      name: organizations.name,
      plan: organizations.plan,
      status: organizations.status,
      createdAt: organizations.createdAt,
    }).from(organizations)
      .where(ne(organizations.plan, "system"))
      .orderBy(desc(organizations.createdAt))
      .limit(10),
    db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      organizationId: users.organizationId,
    }).from(users)
      .where(ne(users.role, "super_admin"))
      .orderBy(desc(users.createdAt))
      .limit(10),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(20),
    db.select({
      mrr: sql<string>`COALESCE(SUM(CAST(${subscriptionPlans.priceMonthly} AS decimal) * ${subscriptions.seatsPurchased}), 0)`,
    }).from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(inArray(subscriptions.status, ["active", "trialing"])),
  ]);

  const mrr = Number(mrrRows[0]?.mrr ?? 0);

  return c.json({
    success: true,
    data: {
      stats: {
        totalOrganizations: Number(totalOrgs),
        totalUsers: Number(totalUsers),
        totalTwins: Number(totalTwins),
        totalMeetings: Number(totalMeetings),
        activeSubscriptions: Number(activeSubCount),
        mrrUsd: mrr,
        arrUsd: mrr * 12,
      },
      recentOrganizations: recentOrgs,
      recentUsers,
      recentAuditLogs: recentAudit,
    },
  });
});

// ─── All Organizations ────────────────────────────────────────────────────────
router.get("/organizations", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
  const limit = Math.min(100, parseInt(c.req.query("limit") ?? "20"));
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(organizations)
      .where(ne(organizations.plan, "system"))
      .orderBy(desc(organizations.createdAt))
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(organizations).where(ne(organizations.plan, "system")),
  ]);

  const orgIds = rows.map((o) => o.id);

  const [userCounts, twinCounts, subRows] = await Promise.all([
    orgIds.length > 0
      ? db.select({ orgId: users.organizationId, cnt: count() })
          .from(users).where(inArray(users.organizationId, orgIds)).groupBy(users.organizationId)
      : [],
    orgIds.length > 0
      ? db.select({ orgId: aiTwins.organizationId, cnt: count() })
          .from(aiTwins).where(inArray(aiTwins.organizationId, orgIds)).groupBy(aiTwins.organizationId)
      : [],
    orgIds.length > 0
      ? db.select({
          orgId: subscriptions.organizationId,
          status: subscriptions.status,
          planName: subscriptionPlans.name,
          priceMonthly: subscriptionPlans.priceMonthly,
        }).from(subscriptions)
          .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
          .where(inArray(subscriptions.organizationId, orgIds))
      : [],
  ]);

  const ucMap = Object.fromEntries((userCounts as any[]).map((u) => [u.orgId, Number(u.cnt)]));
  const tcMap = Object.fromEntries((twinCounts as any[]).map((t) => [t.orgId, Number(t.cnt)]));
  const subMap: Record<string, any> = {};
  for (const s of subRows as any[]) subMap[s.orgId] = s;

  const data = rows.map((o) => ({
    ...o,
    userCount: ucMap[o.id] ?? 0,
    twinCount: tcMap[o.id] ?? 0,
    subscription: subMap[o.id] ?? null,
  }));

  return c.json({ success: true, data, total: Number(total), page, limit });
});

// ─── Single Organization ──────────────────────────────────────────────────────
router.get("/organizations/:id", async (c) => {
  const { id } = c.req.param();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  if (!org) return c.json({ success: false, error: "Organization not found" }, 404);

  const [orgUsers, orgTwins, orgMeetings, subRows] = await Promise.all([
    db.select({
      id: users.id, email: users.email, fullName: users.fullName,
      role: users.role, status: users.status,
      lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
    }).from(users).where(eq(users.organizationId, id)),
    db.select().from(aiTwins).where(eq(aiTwins.organizationId, id)),
    db.select().from(meetings).where(eq(meetings.organizationId, id))
      .orderBy(desc(meetings.createdAt)).limit(20),
    db.select({ sub: subscriptions, plan: subscriptionPlans })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.organizationId, id))
      .limit(1),
  ]);

  return c.json({
    success: true,
    data: {
      organization: org,
      users: orgUsers,
      twins: orgTwins,
      meetings: orgMeetings,
      subscription: subRows[0] ?? null,
    },
  });
});

// ─── Suspend / Activate Organization ─────────────────────────────────────────
router.patch("/organizations/:id/status", async (c) => {
  const { id } = c.req.param();
  const { status } = await c.req.json();
  if (!["active", "suspended", "cancelled"].includes(status)) {
    return c.json({ success: false, error: "Invalid status. Use active|suspended|cancelled" }, 400);
  }
  const [updated] = await db.update(organizations)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(organizations.id, id), ne(organizations.plan, "system")))
    .returning();
  if (!updated) return c.json({ success: false, error: "Organization not found" }, 404);

  const admin = c.get("user");
  db.insert(auditLogs).values({
    userId: admin.userId,
    action: `admin.org.${status}`,
    resourceType: "organization",
    resourceId: id,
    newValues: { status } as any,
    status: "success",
  }).catch(() => {});

  return c.json({ success: true, data: updated });
});

// ─── All Users ────────────────────────────────────────────────────────────────
router.get("/users", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
  const limit = Math.min(100, parseInt(c.req.query("limit") ?? "20"));
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: users.id, email: users.email, fullName: users.fullName,
      role: users.role, status: users.status,
      lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
      organizationId: users.organizationId,
    }).from(users)
      .where(ne(users.role, "super_admin"))
      .orderBy(desc(users.createdAt))
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(users).where(ne(users.role, "super_admin")),
  ]);

  const orgIds = [...new Set(rows.map((u) => u.organizationId).filter(Boolean))] as string[];
  const orgsMap: Record<string, string> = {};
  if (orgIds.length > 0) {
    const orgs = await db.select({ id: organizations.id, name: organizations.name })
      .from(organizations).where(inArray(organizations.id, orgIds));
    for (const o of orgs) orgsMap[o.id] = o.name;
  }

  const data = rows.map((u) => ({
    ...u,
    organizationName: orgsMap[u.organizationId ?? ""] ?? "Unknown",
  }));

  return c.json({ success: true, data, total: Number(total), page, limit });
});

// ─── Ban / Activate User ──────────────────────────────────────────────────────
router.patch("/users/:id/status", async (c) => {
  const { id } = c.req.param();
  const { status } = await c.req.json();
  if (!["active", "suspended", "banned"].includes(status)) {
    return c.json({ success: false, error: "Invalid status" }, 400);
  }
  const [updated] = await db.update(users)
    .set({ status })
    .where(and(eq(users.id, id), ne(users.role, "super_admin")))
    .returning();
  if (!updated) return c.json({ success: false, error: "User not found" }, 404);
  return c.json({ success: true, data: updated });
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get("/audit-logs", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1"));
  const limit = Math.min(200, parseInt(c.req.query("limit") ?? "50"));
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(auditLogs),
  ]);
  return c.json({ success: true, data: rows, total: Number(total), page, limit });
});

// ─── Growth Analytics ─────────────────────────────────────────────────────────
router.get("/analytics", async (c) => {
  const days = Math.min(365, parseInt(c.req.query("days") ?? "30"));
  const since = new Date(Date.now() - days * 86400000);

  const [
    [{ newOrgs }],
    [{ newUsers }],
    [{ newTwins }],
    [{ newMeetings }],
    mrrRows,
  ] = await Promise.all([
    db.select({ newOrgs: count() }).from(organizations)
      .where(and(ne(organizations.plan, "system"), gte(organizations.createdAt, since))),
    db.select({ newUsers: count() }).from(users)
      .where(and(ne(users.role, "super_admin"), gte(users.createdAt, since))),
    db.select({ newTwins: count() }).from(aiTwins).where(gte(aiTwins.createdAt, since)),
    db.select({ newMeetings: count() }).from(meetings).where(gte(meetings.createdAt, since)),
    db.select({
      mrr: sql<string>`COALESCE(SUM(CAST(${subscriptionPlans.priceMonthly} AS decimal) * ${subscriptions.seatsPurchased}), 0)`,
    }).from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(inArray(subscriptions.status, ["active", "trialing"])),
  ]);

  const mrr = Number(mrrRows[0]?.mrr ?? 0);

  return c.json({
    success: true,
    data: {
      periodDays: days,
      newOrganizations: Number(newOrgs),
      newUsers: Number(newUsers),
      newTwins: Number(newTwins),
      newMeetings: Number(newMeetings),
      currentMrr: mrr,
      currentArr: mrr * 12,
    },
  });
});

// ─── Subscription Plans ───────────────────────────────────────────────────────
router.get("/plans", async (c) => {
  const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.priceMonthly);
  return c.json({ success: true, data: plans });
});

const planSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  priceMonthly: z.number().positive(),
  priceYearly: z.number().positive(),
  maxEmployees: z.number().int().optional(),
  maxTwins: z.number().int().optional(),
  features: z.array(z.string()).optional(),
});

router.post("/plans", async (c) => {
  const body = await c.req.json();
  const data = planSchema.parse(body);
  const [plan] = await db.insert(subscriptionPlans).values(data as any).returning();
  return c.json({ success: true, data: plan }, 201);
});

export default router;
