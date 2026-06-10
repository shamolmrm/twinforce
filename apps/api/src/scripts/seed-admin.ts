#!/usr/bin/env bun
/**
 * Creates the TwinForce super admin account and system organization.
 * Run once after database setup: bun run seed-admin
 */
import { db } from "../db/client.ts";
import { organizations, users, subscriptionPlans, subscriptions } from "../db/schema/index.ts";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "../lib/supabase.ts";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@twinforce.ai";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "TwinForce@Admin2025!";
const ADMIN_NAME = "TwinForce Super Admin";

async function seedPlans() {
  const existing = await db.select({ id: subscriptionPlans.id }).from(subscriptionPlans).limit(1);
  if (existing.length > 0) {
    console.log("  Plans already seeded, skipping.");
    return;
  }
  await db.insert(subscriptionPlans).values([
    {
      name: "Starter",
      slug: "starter",
      description: "Perfect for small teams",
      priceMonthly: "30",
      priceYearly: "288",
      maxEmployees: 10,
      maxTwins: 10,
      features: ["Basic Twin", "5 meetings/mo", "1 knowledge source"] as any,
    },
    {
      name: "Professional",
      slug: "professional",
      description: "For growing organizations",
      priceMonthly: "40",
      priceYearly: "384",
      maxEmployees: 100,
      maxTwins: 100,
      features: ["Advanced Twin", "50 meetings/mo", "10 knowledge sources", "Email intelligence"] as any,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Unlimited scale with SLA",
      priceMonthly: "50",
      priceYearly: "480",
      maxEmployees: -1,
      maxTwins: -1,
      features: ["Full Twin", "Unlimited meetings", "Unlimited sources", "SSO", "On-premise", "SLA"] as any,
    },
  ]);
  console.log("  ✅ Seeded 3 subscription plans.");
}

async function main() {
  console.log("\n🌱 TwinForce Admin Seeder\n");

  // 1. Seed plans
  console.log("Seeding subscription plans...");
  await seedPlans();

  // 2. Check if admin already exists
  console.log("Checking for existing super admin...");
  const existing = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.email, ADMIN_EMAIL), eq(users.role, "super_admin")))
    .limit(1);

  if (existing.length > 0) {
    console.log("  ✅ Super admin already exists:", existing[0].email);
    console.log("\n── Login Credentials ──────────────────────");
    console.log("  URL     : http://localhost:5173/admin/login");
    console.log("  Email   :", ADMIN_EMAIL);
    console.log("  Password:", ADMIN_PASSWORD);
    console.log("───────────────────────────────────────────\n");
    process.exit(0);
  }

  // 3. Create system organization
  console.log("Creating system organization...");
  let [systemOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.plan, "system"))
    .limit(1);

  if (!systemOrg) {
    [systemOrg] = await db
      .insert(organizations)
      .values({
        name: "TwinForce System",
        slug: "twinforce-system-internal",
        plan: "system",
        status: "active",
        maxEmployees: -1,
      })
      .returning();
    console.log("  ✅ Created system organization:", systemOrg.id);
  } else {
    console.log("  ✅ System organization exists:", systemOrg.id);
  }

  // 4. Create Supabase auth user (non-fatal — can skip if Supabase not configured)
  console.log("Creating Supabase auth user...");
  let supabaseAuthId: string | undefined;
  try {
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME, role: "super_admin" },
    });
    if (!error && authData.user) {
      supabaseAuthId = authData.user.id;
      console.log("  ✅ Supabase auth user created:", supabaseAuthId);
    } else if (error?.message?.includes("already registered")) {
      console.log("  ℹ️  Supabase user already exists, continuing.");
    } else {
      console.log("  ⚠️  Supabase auth creation skipped:", error?.message ?? "unknown error");
    }
  } catch (e: any) {
    console.log("  ⚠️  Supabase not configured, skipping:", e.message);
  }

  // 5. Hash password and create user record
  console.log("Creating admin user record...");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const [admin] = await db
    .insert(users)
    .values({
      organizationId: systemOrg.id,
      supabaseAuthId: supabaseAuthId as any,
      email: ADMIN_EMAIL,
      fullName: ADMIN_NAME,
      role: "super_admin",
      status: "active",
      onboardingCompleted: true,
      metadata: { passwordHash } as any,
    })
    .returning();
  console.log("  ✅ Admin user created:", admin.id);

  // 6. Done
  console.log("\n── Login Credentials ──────────────────────");
  console.log("  URL     : http://localhost:5173/admin/login");
  console.log("  Email   :", ADMIN_EMAIL);
  console.log("  Password:", ADMIN_PASSWORD);
  console.log("───────────────────────────────────────────\n");
  console.log("🎉 Admin seeding complete!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Seeding failed:", err.message ?? err);
  process.exit(1);
});
