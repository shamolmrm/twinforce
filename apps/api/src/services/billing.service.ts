import { db } from "../db/client.ts";
import { subscriptionPlans, subscriptions, invoices, organizations } from "../db/schema/index.ts";
import { eq, desc } from "drizzle-orm";
import {
  stripe,
  createCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  constructWebhookEvent,
} from "../lib/stripe.ts";
import { logger } from "../lib/logger.ts";
import { cacheDel } from "../lib/redis.ts";

export async function listPlans() {
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(subscriptionPlans.priceMonthly);
}

export async function getSubscription(orgId: string) {
  const [sub] = await db.select({
    subscription: subscriptions,
    plan: subscriptionPlans,
  }).from(subscriptions).innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id)).where(eq(subscriptions.organizationId, orgId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  return sub ?? null;
}

export async function createSubscription(orgId: string, planSlug: string, billingCycle: "monthly" | "yearly", orgName: string, ownerEmail: string) {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, planSlug)).limit(1);
  if (!plan) throw new Error("Plan not found");

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org) throw new Error("Organization not found");

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    customerId = await createCustomer(ownerEmail, orgName, orgId);
    await db.update(organizations).set({ stripeCustomerId: customerId }).where(eq(organizations.id, orgId));
  }

  const priceId = billingCycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
  if (!priceId) {
    // No Stripe price configured — create a trial subscription directly
    const [sub] = await db.insert(subscriptions).values({
      organizationId: orgId,
      planId: plan.id,
      status: "trialing",
      billingCycle,
      trialEnd: new Date(Date.now() + 14 * 86400000),
    }).returning();
    return { checkoutUrl: null, subscription: sub };
  }

  const checkoutUrl = await createCheckoutSession(
    customerId,
    priceId,
    orgId,
    `${process.env.FRONTEND_URL}/billing?success=1`,
    `${process.env.FRONTEND_URL}/billing?canceled=1`,
  );

  return { checkoutUrl };
}

export async function cancelSubscription(orgId: string) {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, orgId)).orderBy(desc(subscriptions.createdAt)).limit(1);
  if (!sub) throw new Error("No active subscription");

  if (sub.stripeSubscriptionId) {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
  }

  const [updated] = await db.update(subscriptions).set({ cancelAt: sub.currentPeriodEnd }).where(eq(subscriptions.id, sub.id)).returning();
  return updated;
}

export async function billingPortal(orgId: string) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org?.stripeCustomerId) throw new Error("No billing account found");
  return createBillingPortalSession(org.stripeCustomerId, `${process.env.FRONTEND_URL}/billing`);
}

export async function listInvoices(orgId: string) {
  return db.select().from(invoices).where(eq(invoices.organizationId, orgId)).orderBy(desc(invoices.createdAt)).limit(24);
}

export async function handleStripeWebhook(payload: string, signature: string) {
  const event = constructWebhookEvent(payload, signature);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as any;
      const orgId = sub.metadata?.organization_id;
      if (!orgId) break;

      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.stripePriceIdMonthly, sub.items.data[0].price.id)).limit(1);

      await db.insert(subscriptions).values({
        organizationId: orgId,
        planId: plan?.id ?? (await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, "starter")).limit(1))[0]?.id,
        stripeSubscriptionId: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      } as any).onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          status: sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      await cacheDel(`org:${orgId}`);
      break;
    }

    case "invoice.paid": {
      const inv = event.data.object as any;
      const orgId = inv.subscription_details?.metadata?.organization_id ?? inv.metadata?.organization_id;
      if (!orgId) break;
      await db.insert(invoices).values({
        organizationId: orgId,
        stripeInvoiceId: inv.id,
        amountCents: inv.amount_paid,
        currency: inv.currency,
        status: "paid",
        paidAt: new Date(inv.status_transitions.paid_at * 1000),
        invoicePdfUrl: inv.invoice_pdf,
      } as any).onConflictDoUpdate({ target: invoices.stripeInvoiceId, set: { status: "paid" } });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
      await db.update(subscriptions).set({ status: "canceled", canceledAt: new Date() }).where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }
  }

  return { received: true };
}
