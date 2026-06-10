import { db } from "../db/client.ts";
import { notifications } from "../db/schema/index.ts";
import { eq, and, isNull, desc, count } from "drizzle-orm";

export async function listNotifications(userId: string, orgId: string, opts: { page?: number; limit?: number } = {}) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const [rows, [{ value: unreadCount }]] = await Promise.all([
    db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.organizationId, orgId))).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ]);
  return { data: rows, unreadCount: Number(unreadCount), page, limit };
}

export async function markRead(notificationId: string, userId: string) {
  const [updated] = await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).returning({ id: notifications.id });
  if (!updated) throw new Error("Notification not found");
  return updated;
}

export async function markAllRead(userId: string, orgId: string) {
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return { success: true };
}

export async function deleteNotification(notificationId: string, userId: string) {
  const [deleted] = await db.delete(notifications).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).returning({ id: notifications.id });
  if (!deleted) throw new Error("Notification not found");
}

export async function createNotification(userId: string, orgId: string, data: { type: string; title: string; body?: string; data?: unknown; actionUrl?: string }) {
  const [notif] = await db.insert(notifications).values({
    userId,
    organizationId: orgId,
    type: data.type,
    title: data.title,
    body: data.body,
    data: data.data as any,
    actionUrl: data.actionUrl,
  }).returning();
  return notif;
}
