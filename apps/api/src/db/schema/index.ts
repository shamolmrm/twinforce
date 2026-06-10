import {
  pgTable, uuid, varchar, text, boolean, integer, decimal,
  jsonb, timestamp, date, inet, unique, index, foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const now = () => timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull();
const id = () => uuid("id").primaryKey().default(sql`uuid_generate_v4()`);
const orgRef = () => uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" });

// ============================================================
// ORGANIZATIONS
// ============================================================
export const organizations = pgTable("organizations", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  domain: varchar("domain", { length: 255 }),
  logoUrl: text("logo_url"),
  plan: varchar("plan", { length: 50 }).default("trial"),
  status: varchar("status", { length: 50 }).default("active"),
  maxEmployees: integer("max_employees").default(10),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  settings: jsonb("settings").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
  updatedAt: updatedAt(),
});

// ============================================================
// USERS
// ============================================================
export const users = pgTable("users", {
  id: id(),
  organizationId: orgRef(),
  supabaseAuthId: uuid("supabase_auth_id").unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 50 }).default("employee"),
  department: varchar("department", { length: 100 }),
  jobTitle: varchar("job_title", { length: 150 }),
  status: varchar("status", { length: 50 }).default("active"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  settings: jsonb("settings").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
  updatedAt: updatedAt(),
});

// ============================================================
// TEAMS
// ============================================================
export const teams = pgTable("teams", {
  id: id(),
  organizationId: orgRef(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  managerId: uuid("manager_id").references(() => users.id),
  settings: jsonb("settings").default({}),
  createdAt: now(),
  updatedAt: updatedAt(),
});

export const teamMembers = pgTable("team_members", {
  id: id(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).default(sql`now()`),
}, (t) => ({ uniq: unique().on(t.teamId, t.userId) }));

// ============================================================
// ROLES & PERMISSIONS
// ============================================================
export const roles = pgTable("roles", {
  id: id(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false),
  permissions: jsonb("permissions").default([]),
  createdAt: now(),
});

export const userRoles = pgTable("user_roles", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  grantedBy: uuid("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at", { withTimezone: true }).default(sql`now()`),
}, (t) => ({ uniq: unique().on(t.userId, t.roleId) }));

// ============================================================
// AI TWINS
// ============================================================
export const aiTwins = pgTable("ai_twins", {
  id: id(),
  organizationId: orgRef(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("training"),
  trainingProgress: integer("training_progress").default(0),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).default("0"),
  personalityConfig: jsonb("personality_config").default({}),
  toneSettings: jsonb("tone_settings").default({}),
  communicationStyle: jsonb("communication_style").default({}),
  behaviorModel: jsonb("behavior_model").default({}),
  lastTrainedAt: timestamp("last_trained_at", { withTimezone: true }),
  totalInteractions: integer("total_interactions").default(0),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
  updatedAt: updatedAt(),
}, (t) => ({ uniqUser: unique().on(t.userId) }));

export const twinMemories = pgTable("twin_memories", {
  id: id(),
  twinId: uuid("twin_id").notNull().references(() => aiTwins.id, { onDelete: "cascade" }),
  organizationId: orgRef(),
  memoryType: varchar("memory_type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  embeddingId: varchar("embedding_id", { length: 255 }),
  importanceScore: decimal("importance_score", { precision: 3, scale: 2 }).default("0.5"),
  source: varchar("source", { length: 100 }),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
});

export const twinInteractions = pgTable("twin_interactions", {
  id: id(),
  twinId: uuid("twin_id").notNull().references(() => aiTwins.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  interactionType: varchar("interaction_type", { length: 50 }).notNull(),
  inputText: text("input_text"),
  outputText: text("output_text"),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  wasEscalated: boolean("was_escalated").default(false),
  escalationReason: text("escalation_reason"),
  responseTimeMs: integer("response_time_ms"),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
});

export const twinTrainingJobs = pgTable("twin_training_jobs", {
  id: id(),
  twinId: uuid("twin_id").notNull().references(() => aiTwins.id, { onDelete: "cascade" }),
  organizationId: orgRef(),
  status: varchar("status", { length: 50 }).default("pending"),
  dataSources: jsonb("data_sources").default([]),
  progress: integer("progress").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: now(),
});

// ============================================================
// MEETINGS
// ============================================================
export const meetings = pgTable("meetings", {
  id: id(),
  organizationId: orgRef(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  title: varchar("title", { length: 500 }),
  platform: varchar("platform", { length: 50 }),
  externalMeetingId: varchar("external_meeting_id", { length: 255 }),
  meetingUrl: text("meeting_url"),
  status: varchar("status", { length: 50 }).default("scheduled"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  transcript: text("transcript"),
  rawTranscript: jsonb("raw_transcript"),
  audioFileUrl: text("audio_file_url"),
  summary: text("summary"),
  keyDecisions: text("key_decisions").array(),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
  updatedAt: updatedAt(),
});

export const meetingParticipants = pgTable("meeting_participants", {
  id: id(),
  meetingId: uuid("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  twinId: uuid("twin_id").references(() => aiTwins.id),
  participantType: varchar("participant_type", { length: 50 }).default("human"),
  role: varchar("role", { length: 50 }).default("attendee"),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  leftAt: timestamp("left_at", { withTimezone: true }),
  speakingTimeSeconds: integer("speaking_time_seconds").default(0),
});

export const meetingActionItems = pgTable("meeting_action_items", {
  id: id(),
  meetingId: uuid("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  organizationId: orgRef(),
  assignedTo: uuid("assigned_to").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 50 }).default("open"),
  createdAt: now(),
  updatedAt: updatedAt(),
});

export const meetingNotes = pgTable("meeting_notes", {
  id: id(),
  meetingId: uuid("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").references(() => users.id),
  twinId: uuid("twin_id").references(() => aiTwins.id),
  content: text("content").notNull(),
  noteType: varchar("note_type", { length: 50 }).default("general"),
  timestampSeconds: integer("timestamp_seconds"),
  createdAt: now(),
});

// ============================================================
// KNOWLEDGE BASE
// ============================================================
export const knowledgeSources = pgTable("knowledge_sources", {
  id: id(),
  organizationId: orgRef(),
  name: varchar("name", { length: 255 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  connectionConfig: jsonb("connection_config").default({}),
  syncStatus: varchar("sync_status", { length: 50 }).default("pending"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  totalDocuments: integer("total_documents").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: now(),
  updatedAt: updatedAt(),
});

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: id(),
  organizationId: orgRef(),
  sourceId: uuid("source_id").notNull().references(() => knowledgeSources.id, { onDelete: "cascade" }),
  externalId: varchar("external_id", { length: 500 }),
  title: varchar("title", { length: 1000 }),
  content: text("content"),
  contentHash: varchar("content_hash", { length: 64 }),
  fileUrl: text("file_url"),
  fileType: varchar("file_type", { length: 50 }),
  fileSizeBytes: integer("file_size_bytes"),
  metadata: jsonb("metadata").default({}),
  isIndexed: boolean("is_indexed").default(false),
  indexedAt: timestamp("indexed_at", { withTimezone: true }),
  createdAt: now(),
  updatedAt: updatedAt(),
});

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: id(),
  organizationId: orgRef(),
  documentId: uuid("document_id").notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count"),
  qdrantPointId: varchar("qdrant_point_id", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
});

// ============================================================
// EMAIL INTELLIGENCE
// ============================================================
export const emailAccounts = pgTable("email_accounts", {
  id: id(),
  organizationId: orgRef(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  syncStatus: varchar("sync_status", { length: 50 }).default("pending"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  totalEmailsProcessed: integer("total_emails_processed").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: now(),
});

export const emailThreads = pgTable("email_threads", {
  id: id(),
  organizationId: orgRef(),
  emailAccountId: uuid("email_account_id").notNull().references(() => emailAccounts.id, { onDelete: "cascade" }),
  externalThreadId: varchar("external_thread_id", { length: 500 }),
  subject: varchar("subject", { length: 1000 }),
  participants: jsonb("participants").default([]),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  messageCount: integer("message_count").default(0),
  category: varchar("category", { length: 100 }),
  sentiment: varchar("sentiment", { length: 50 }),
  priority: varchar("priority", { length: 20 }).default("normal"),
  isProcessed: boolean("is_processed").default(false),
  createdAt: now(),
});

export const emailDrafts = pgTable("email_drafts", {
  id: id(),
  organizationId: orgRef(),
  twinId: uuid("twin_id").notNull().references(() => aiTwins.id, { onDelete: "cascade" }),
  threadId: uuid("thread_id").references(() => emailThreads.id),
  subject: varchar("subject", { length: 1000 }),
  toAddresses: jsonb("to_addresses").default([]),
  ccAddresses: jsonb("cc_addresses").default([]),
  body: text("body").notNull(),
  tone: varchar("tone", { length: 50 }).default("professional"),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  status: varchar("status", { length: 50 }).default("draft"),
  approvedBy: uuid("approved_by").references(() => users.id),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: now(),
});

// ============================================================
// INTEGRATIONS
// ============================================================
export const integrations = pgTable("integrations", {
  id: id(),
  organizationId: orgRef(),
  integrationType: varchar("integration_type", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }),
  config: jsonb("config").default({}),
  credentialsEncrypted: text("credentials_encrypted"),
  status: varchar("status", { length: 50 }).default("inactive"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: now(),
  updatedAt: updatedAt(),
});

// ============================================================
// BILLING
// ============================================================
export const subscriptionPlans = pgTable("subscription_plans", {
  id: id(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),
  maxEmployees: integer("max_employees"),
  maxTwins: integer("max_twins"),
  maxMeetingsPerMonth: integer("max_meetings_per_month"),
  maxStorageGb: integer("max_storage_gb"),
  features: jsonb("features").default([]),
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
  stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: now(),
});

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  organizationId: orgRef(),
  planId: uuid("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  status: varchar("status", { length: 50 }).default("trialing"),
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  seatsPurchased: integer("seats_purchased").default(1),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
  updatedAt: updatedAt(),
});

export const invoices = pgTable("invoices", {
  id: id(),
  organizationId: orgRef(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 10 }).default("usd"),
  status: varchar("status", { length: 50 }).default("draft"),
  invoicePdfUrl: text("invoice_pdf_url"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  lineItems: jsonb("line_items").default([]),
  createdAt: now(),
});

export const usageRecords = pgTable("usage_records", {
  id: id(),
  organizationId: orgRef(),
  userId: uuid("user_id").references(() => users.id),
  twinId: uuid("twin_id").references(() => aiTwins.id),
  usageType: varchar("usage_type", { length: 100 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  costCents: integer("cost_cents").default(0),
  metadata: jsonb("metadata").default({}),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).default(sql`now()`).notNull(),
});

// ============================================================
// AUDIT LOGS
// ============================================================
export const auditLogs = pgTable("audit_logs", {
  id: id(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 200 }).notNull(),
  resourceType: varchar("resource_type", { length: 100 }),
  resourceId: uuid("resource_id"),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  status: varchar("status", { length: 50 }).default("success"),
  durationMs: integer("duration_ms"),
  createdAt: now(),
});

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notifications = pgTable("notifications", {
  id: id(),
  organizationId: orgRef(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body"),
  data: jsonb("data").default({}),
  readAt: timestamp("read_at", { withTimezone: true }),
  actionUrl: text("action_url"),
  createdAt: now(),
});

// ============================================================
// API KEYS
// ============================================================
export const apiKeys = pgTable("api_keys", {
  id: id(),
  organizationId: orgRef(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
  scopes: jsonb("scopes").default([]),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
  createdAt: now(),
});

// ============================================================
// WEBHOOKS
// ============================================================
export const webhooks = pgTable("webhooks", {
  id: id(),
  organizationId: orgRef(),
  url: text("url").notNull(),
  events: jsonb("events").default([]),
  secretHash: varchar("secret_hash", { length: 255 }),
  isActive: boolean("is_active").default(true),
  failureCount: integer("failure_count").default(0),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: now(),
});

// ============================================================
// ANALYTICS SNAPSHOTS
// ============================================================
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: id(),
  organizationId: orgRef(),
  snapshotDate: date("snapshot_date").notNull(),
  activeUsers: integer("active_users").default(0),
  activeTwins: integer("active_twins").default(0),
  meetingsHeld: integer("meetings_held").default(0),
  emailsProcessed: integer("emails_processed").default(0),
  knowledgeQueries: integer("knowledge_queries").default(0),
  twinInteractions: integer("twin_interactions").default(0),
  hoursSaved: decimal("hours_saved", { precision: 10, scale: 2 }).default("0"),
  tasksAutomated: integer("tasks_automated").default(0),
  mrrCents: integer("mrr_cents").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: now(),
}, (t) => ({ uniq: unique().on(t.organizationId, t.snapshotDate) }));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type AiTwin = typeof aiTwins.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
