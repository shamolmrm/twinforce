import { Hono } from "hono";
import * as billingService from "../services/billing.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { requireOwnerOrAdmin } from "../middleware/rbac.ts";
import { tenantGuard } from "../middleware/tenant.ts";
import { apiRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";
import { db } from "../db/client.ts";
import { users } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";

const router = new Hono();

// Plans endpoint — public, no auth needed
router.get("/plans", async (c) => {
  const plans = await billingService.listPlans();
  return c.json({ success: true, data: plans });
});

// Stripe webhook — must be before auth middleware, raw body needed
router.post("/webhook/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.json({ error: "Missing signature" }, 400);
  const payload = await c.req.text();
  try {
    const result = await billingService.handleStripeWebhook(payload, signature);
    return c.json(result);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

// Protected billing routes
router.use("*", requireAuth, tenantGuard, apiRateLimit);

router.get("/subscription", async (c) => {
  const user = c.get("user");
  const sub = await billingService.getSubscription(user.organizationId);
  return c.json({ success: true, data: sub });
});

router.post("/subscription/create", requireOwnerOrAdmin(), auditLog("billing.subscription.create"), async (c) => {
  const user = c.get("user");
  const { planSlug, billingCycle } = await c.req.json();
  if (!planSlug) return c.json({ success: false, error: "planSlug required" }, 400);

  const [orgUser] = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
  const result = await billingService.createSubscription(user.organizationId, planSlug, billingCycle ?? "monthly", user.organizationId, orgUser.email);
  return c.json({ success: true, data: result });
});

router.post("/subscription/upgrade", requireOwnerOrAdmin(), auditLog("billing.subscription.upgrade"), async (c) => {
  const user = c.get("user");
  const { planSlug, billingCycle } = await c.req.json();
  const [orgUser] = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
  const result = await billingService.createSubscription(user.organizationId, planSlug, billingCycle ?? "monthly", user.organizationId, orgUser.email);
  return c.json({ success: true, data: result });
});

router.post("/subscription/cancel", requireOwnerOrAdmin(), auditLog("billing.subscription.cancel"), async (c) => {
  const user = c.get("user");
  const result = await billingService.cancelSubscription(user.organizationId);
  return c.json({ success: true, data: result });
});

router.get("/invoices", async (c) => {
  const user = c.get("user");
  const invoices = await billingService.listInvoices(user.organizationId);
  return c.json({ success: true, data: invoices });
});

router.get("/usage", async (c) => {
  const user = c.get("user");
  const { getUsageStats } = await import("../services/analytics.service.ts");
  const usage = await getUsageStats(user.organizationId);
  return c.json({ success: true, data: usage });
});

router.post("/portal", requireOwnerOrAdmin(), async (c) => {
  const user = c.get("user");
  const url = await billingService.billingPortal(user.organizationId);
  return c.json({ success: true, data: { url } });
});

export default router;
