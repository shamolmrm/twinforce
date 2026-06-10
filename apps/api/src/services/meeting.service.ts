import { db } from "../db/client.ts";
import { meetings, meetingParticipants, meetingActionItems, meetingNotes } from "../db/schema/index.ts";
import { eq, and, desc, count } from "drizzle-orm";
import { publish } from "../lib/nats.ts";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function listMeetings(orgId: string, opts: { page?: number; limit?: number; status?: string } = {}) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(meetings).where(eq(meetings.organizationId, orgId)).orderBy(desc(meetings.scheduledAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(meetings).where(eq(meetings.organizationId, orgId)),
  ]);
  return { data: rows, total: Number(total), page, limit };
}

export async function getMeetingById(id: string, orgId: string) {
  const [meeting] = await db.select().from(meetings).where(and(eq(meetings.id, id), eq(meetings.organizationId, orgId))).limit(1);
  return meeting ?? null;
}

export async function createMeeting(orgId: string, userId: string, data: { title: string; platform?: string; meetingUrl?: string; scheduledAt?: Date; externalMeetingId?: string }) {
  const [meeting] = await db.insert(meetings).values({
    organizationId: orgId,
    createdBy: userId,
    ...data,
    status: "scheduled",
  }).returning();

  await meetingParticipants && db.insert(meetingParticipants).values({ meetingId: meeting.id, userId, participantType: "human", role: "organizer" });
  return meeting;
}

export async function updateMeeting(id: string, orgId: string, data: Partial<{ title: string; meetingUrl: string; scheduledAt: Date; status: string }>) {
  const [updated] = await db.update(meetings).set(data as any).where(and(eq(meetings.id, id), eq(meetings.organizationId, orgId))).returning();
  if (!updated) throw new Error("Meeting not found");
  return updated;
}

export async function deleteMeeting(id: string, orgId: string) {
  const [deleted] = await db.delete(meetings).where(and(eq(meetings.id, id), eq(meetings.organizationId, orgId))).returning({ id: meetings.id });
  if (!deleted) throw new Error("Meeting not found");
}

export async function joinMeeting(id: string, orgId: string, userId: string) {
  await db.update(meetings).set({ status: "in_progress", startedAt: new Date() }).where(and(eq(meetings.id, id), eq(meetings.organizationId, orgId)));
  const exists = await db.select().from(meetingParticipants).where(and(eq(meetingParticipants.meetingId, id), eq(meetingParticipants.userId, userId))).limit(1);
  if (exists.length === 0) {
    await db.insert(meetingParticipants).values({ meetingId: id, userId, joinedAt: new Date() });
  } else {
    await db.update(meetingParticipants).set({ joinedAt: new Date() }).where(and(eq(meetingParticipants.meetingId, id), eq(meetingParticipants.userId, userId)));
  }
  return { joined: true };
}

export async function endMeeting(id: string, orgId: string) {
  const now = new Date();
  const [meeting] = await db.select().from(meetings).where(and(eq(meetings.id, id), eq(meetings.organizationId, orgId))).limit(1);
  if (!meeting) throw new Error("Meeting not found");

  const durationMs = meeting.startedAt ? now.getTime() - new Date(meeting.startedAt).getTime() : 0;
  const durationMinutes = Math.ceil(durationMs / 60000);

  const [updated] = await db.update(meetings).set({ status: "ended", endedAt: now, durationMinutes }).where(eq(meetings.id, id)).returning();
  await publish("meeting.ended", { meetingId: id, orgId });
  return updated;
}

export async function getMeetingTranscript(id: string, orgId: string) {
  const [meeting] = await db.select({ transcript: meetings.transcript, rawTranscript: meetings.rawTranscript }).from(meetings).where(and(eq(meetings.id, id), eq(meetings.organizationId, orgId))).limit(1);
  if (!meeting) throw new Error("Meeting not found");
  return meeting;
}

export async function getMeetingSummary(id: string, orgId: string) {
  const [meeting] = await db.select({ summary: meetings.summary, keyDecisions: meetings.keyDecisions, sentimentScore: meetings.sentimentScore }).from(meetings).where(and(eq(meetings.id, id), eq(meetings.organizationId, orgId))).limit(1);
  if (!meeting?.summary) {
    // Trigger AI summarization if not done yet
    const [full] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
    if (full?.transcript) {
      await publish("meeting.summarize", { meetingId: id, orgId });
    }
  }
  return meeting;
}

export async function getActionItems(meetingId: string, orgId: string) {
  return db.select().from(meetingActionItems).where(and(eq(meetingActionItems.meetingId, meetingId), eq(meetingActionItems.organizationId, orgId))).orderBy(desc(meetingActionItems.createdAt));
}

export async function createActionItem(meetingId: string, orgId: string, data: { title: string; description?: string; assignedTo?: string; dueDate?: string; priority?: string }) {
  const [item] = await db.insert(meetingActionItems).values({ meetingId, organizationId: orgId, ...data } as any).returning();
  return item;
}

export async function getMeetingNotes(meetingId: string, orgId: string) {
  return db.select().from(meetingNotes).where(eq(meetingNotes.meetingId, meetingId)).orderBy(desc(meetingNotes.createdAt));
}
