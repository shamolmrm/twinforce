import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "../db/client.ts";
import { users, organizations, roles, userRoles, subscriptions, subscriptionPlans } from "../db/schema/index.ts";
import { eq, and, or } from "drizzle-orm";
import { getRedis } from "../lib/redis.ts";
import { sendEmail, passwordResetHtml, inviteEmailHtml } from "../lib/email.ts";
import { supabaseAdmin } from "../lib/supabase.ts";
import { logger } from "../lib/logger.ts";
import { randomBytes } from "crypto";

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET!);
const refreshSecret = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET!);
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(jwtSecret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(refreshSecret);
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing.length > 0) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(input.password, 12);

  const slug =
    input.organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 50) +
    "-" + randomBytes(3).toString("hex");

  const [org] = await db.insert(organizations).values({
    name: input.organizationName,
    slug,
    plan: "trial",
  }).returning();

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (authErr) logger.warn({ err: authErr }, "Supabase auth user creation failed — continuing");

  const [user] = await db.insert(users).values({
    organizationId: org.id,
    supabaseAuthId: authData?.user?.id as any,
    email: input.email,
    fullName: input.fullName,
    role: "owner",
    metadata: { passwordHash } as any,
  }).returning();

  // Assign owner role in user_roles
  const [ownerRole] = await db.select().from(roles)
    .where(and(eq(roles.name, "owner"), eq(roles.isSystem, true))).limit(1);
  if (ownerRole) {
    await db.insert(userRoles).values({ userId: user.id, roleId: ownerRole.id }).catch(() => {});
  }

  // Create 14-day trial subscription
  const [starterPlan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, "starter")).limit(1);
  if (starterPlan) {
    await db.insert(subscriptions).values({
      organizationId: org.id,
      planId: starterPlan.id,
      status: "trialing",
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }).catch(() => {});
  }

  const accessToken = await signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
    },
    accessToken,
    refreshToken,
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.status !== "active") throw new Error("Invalid email or password");

  const meta = user.metadata as { passwordHash?: string } | null;
  if (!meta?.passwordHash) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(password, meta.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const accessToken = await signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
    },
    accessToken,
    refreshToken,
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout(token: string) {
  const redis = getRedis();
  await redis.set(`blacklist:${token}`, "1", "EX", 900);
}

// ─── Refresh Tokens ───────────────────────────────────────────────────────────
export async function refreshTokens(refreshToken: string) {
  let payload: Record<string, unknown>;
  try {
    const { payload: p } = await jwtVerify(refreshToken, refreshSecret);
    payload = p as Record<string, unknown>;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  if (payload.type !== "refresh") throw new Error("Invalid token type");
  const userId = payload.sub as string;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status !== "active") throw new Error("User not found");

  const accessToken = await signAccessToken(userId);
  const newRefreshToken = await signRefreshToken(userId);

  return { accessToken, refreshToken: newRefreshToken };
}

// ─── Password Reset ───────────────────────────────────────────────────────────
export async function sendPasswordReset(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return;

  const resetToken = randomBytes(32).toString("hex");
  const redis = getRedis();
  await redis.set(`pwd-reset:${resetToken}`, user.id, "EX", 3600);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: "Reset your TwinForce password",
    html: passwordResetHtml(resetUrl),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const redis = getRedis();
  const userId = await redis.get(`pwd-reset:${token}`);
  if (!userId) throw new Error("Invalid or expired reset token");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ metadata: { passwordHash } as any }).where(eq(users.id, userId));
  await redis.del(`pwd-reset:${token}`);
  await redis.del(`user:${userId}`);
}

// ─── Magic Link ───────────────────────────────────────────────────────────────
export async function sendMagicLink(email: string) {
  // Use Supabase magic link — redirects back to /auth/callback with hash tokens
  const { error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${process.env.FRONTEND_URL}/auth/callback` },
  });
  if (error) throw new Error(error.message);
}

// ─── OAuth User Sync ──────────────────────────────────────────────────────────
// Creates or links a user record after successful Supabase OAuth authentication.
// Called from POST /auth/oauth/sync with the Supabase access token.
export async function syncOAuthUser(
  supabaseAuthId: string,
  email: string,
  fullName?: string,
) {
  // Find by supabase_auth_id first, then by email (handles account linking)
  const existing = await db.select().from(users)
    .where(or(eq(users.supabaseAuthId, supabaseAuthId), eq(users.email, email)))
    .limit(1);

  let user = existing[0];

  if (!user) {
    // Brand new OAuth user — auto-create organization
    const baseSlug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
    const slug = baseSlug.slice(0, 40) + "-" + randomBytes(3).toString("hex");
    const orgName = fullName ? `${fullName}'s Organization` : `${baseSlug} Workspace`;

    const [org] = await db.insert(organizations).values({
      name: orgName,
      slug,
      plan: "trial",
    }).returning();

    [user] = await db.insert(users).values({
      organizationId: org.id,
      supabaseAuthId,
      email,
      fullName: fullName ?? null,
      role: "owner",
      status: "active",
      onboardingCompleted: false,
    }).returning();

    // Create trial subscription
    const [starterPlan] = await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.slug, "starter")).limit(1);
    if (starterPlan) {
      await db.insert(subscriptions).values({
        organizationId: org.id,
        planId: starterPlan.id,
        status: "trialing",
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      }).catch(() => {});
    }

    logger.info({ userId: user.id, email }, "New OAuth user created");
  } else if (!user.supabaseAuthId) {
    // Existing email/password user — link their Supabase account
    [user] = await db.update(users)
      .set({ supabaseAuthId })
      .where(eq(users.id, user.id))
      .returning();
  }

  if (user.status !== "active") throw new Error("Account is not active");

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const accessToken = await signAccessToken(user.id);
  const refreshToken = await signRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
    },
    accessToken,
    refreshToken,
  };
}
