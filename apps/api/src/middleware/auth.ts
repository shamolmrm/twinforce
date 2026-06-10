import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { jwtVerify } from "jose";
import { db } from "../db/client.ts";
import { users } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";
import { getRedis } from "../lib/redis.ts";

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET!);

export type AuthUser = {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  supabaseAuthId?: string;
};

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export const requireAuth = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);

  // Check if token is blacklisted (logout)
  const redis = getRedis();
  const blacklisted = await redis.get(`blacklist:${token}`);
  if (blacklisted) {
    throw new HTTPException(401, { message: "Token has been revoked" });
  }

  let payload: Record<string, unknown>;
  try {
    const { payload: p } = await jwtVerify(token, jwtSecret);
    payload = p as Record<string, unknown>;
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }

  const userId = payload.sub as string;

  // Cache user lookup for 60s to avoid DB hit on every request
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    c.set("user", JSON.parse(cached));
    return next();
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status !== "active") {
    throw new HTTPException(401, { message: "User not found or inactive" });
  }

  const authUser: AuthUser = {
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    role: user.role ?? "employee",
    supabaseAuthId: user.supabaseAuthId ?? undefined,
  };

  await redis.set(cacheKey, JSON.stringify(authUser), "EX", 60);
  c.set("user", authUser);
  return next();
});

export const optionalAuth = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return next();
  try {
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, jwtSecret);
    const userId = payload.sub as string;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user) {
      c.set("user", {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        role: user.role ?? "employee",
      });
    }
  } catch {}
  return next();
});
