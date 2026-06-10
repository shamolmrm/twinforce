import { db } from "../db/client.ts";
import { users, userRoles, roles, notifications } from "../db/schema/index.ts";
import { eq, and, ilike, desc, count } from "drizzle-orm";
import { cacheDel } from "../lib/redis.ts";
import { sendEmail, inviteEmailHtml } from "../lib/email.ts";
import { randomBytes } from "crypto";
import { getRedis } from "../lib/redis.ts";
import bcrypt from "bcryptjs";

export async function listUsers(orgId: string, opts: { page?: number; limit?: number; search?: string } = {}) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const query = db.select().from(users).where(
    opts.search
      ? and(eq(users.organizationId, orgId), ilike(users.fullName!, `%${opts.search}%`))
      : eq(users.organizationId, orgId),
  ).orderBy(desc(users.createdAt)).limit(limit).offset(offset);

  const [rows, [{ value: total }]] = await Promise.all([
    query,
    db.select({ value: count() }).from(users).where(eq(users.organizationId, orgId)),
  ]);

  return { data: rows, total: Number(total), page, limit };
}

export async function getUserById(id: string, orgId: string) {
  const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.organizationId, orgId))).limit(1);
  return user ?? null;
}

export async function updateUser(id: string, orgId: string, data: Partial<{ fullName: string; department: string; jobTitle: string; settings: unknown; avatarUrl: string }>) {
  const [updated] = await db.update(users).set(data as any).where(
    and(eq(users.id, id), eq(users.organizationId, orgId)),
  ).returning();
  if (!updated) throw new Error("User not found");
  await cacheDel(`user:${id}`);
  return updated;
}

export async function deleteUser(id: string, orgId: string) {
  const [deleted] = await db.update(users).set({ status: "deleted" }).where(
    and(eq(users.id, id), eq(users.organizationId, orgId)),
  ).returning({ id: users.id });
  if (!deleted) throw new Error("User not found");
  await cacheDel(`user:${id}`);
}

export async function updateUserRole(id: string, orgId: string, roleName: string, grantedBy: string) {
  const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.organizationId, orgId))).limit(1);
  if (!user) throw new Error("User not found");

  await db.update(users).set({ role: roleName } as any).where(eq(users.id, id));

  const [role] = await db.select().from(roles).where(and(eq(roles.name, roleName), eq(roles.isSystem, true))).limit(1);
  if (role) {
    await db.delete(userRoles).where(eq(userRoles.userId, id));
    await db.insert(userRoles).values({ userId: id, roleId: role.id, grantedBy });
  }

  await cacheDel(`user:${id}`);
}

export async function inviteUser(orgId: string, invitedBy: string, email: string, roleName: string, orgName: string, inviterName: string) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw new Error("User with this email already exists");

  const inviteToken = randomBytes(32).toString("hex");
  const redis = getRedis();
  await redis.set(`invite:${inviteToken}`, JSON.stringify({ orgId, email, roleName }), "EX", 172800); // 48h

  const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
  await sendEmail({ to: email, subject: `Join ${orgName} on TwinForce`, html: inviteEmailHtml(inviterName, orgName, inviteUrl) });

  return { inviteToken };
}

export async function acceptInvite(token: string, fullName: string, password: string) {
  const redis = getRedis();
  const raw = await redis.get(`invite:${token}`);
  if (!raw) throw new Error("Invalid or expired invite token");

  const { orgId, email, roleName } = JSON.parse(raw) as { orgId: string; email: string; roleName: string };
  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db.insert(users).values({
    organizationId: orgId,
    email,
    fullName,
    role: roleName,
    metadata: { passwordHash } as any,
  }).returning();

  await redis.del(`invite:${token}`);
  return user;
}
