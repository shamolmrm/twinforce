-- ============================================================
-- TWINFORCE DATABASE SCHEMA
-- PostgreSQL 15+ / Supabase compatible
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ORGANIZATIONS (Multi-Tenant Root)
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  logo_url TEXT,
  plan VARCHAR(50) DEFAULT 'trial',
  status VARCHAR(50) DEFAULT 'active',
  max_employees INTEGER DEFAULT 10,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supabase_auth_id UUID UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'employee',
  department VARCHAR(100),
  job_title VARCHAR(150),
  status VARCHAR(50) DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ============================================================
-- ROLES & PERMISSIONS (RBAC)
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- ============================================================
-- AI TWINS
-- ============================================================
CREATE TABLE ai_twins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'training',
  training_progress INTEGER DEFAULT 0,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  personality_config JSONB DEFAULT '{}',
  tone_settings JSONB DEFAULT '{"default":"professional","options":["casual","professional","executive","friendly","strict"]}',
  communication_style JSONB DEFAULT '{}',
  behavior_model JSONB DEFAULT '{}',
  last_trained_at TIMESTAMPTZ,
  total_interactions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE twin_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twin_id UUID NOT NULL REFERENCES ai_twins(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  memory_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  embedding_id VARCHAR(255),
  importance_score DECIMAL(3,2) DEFAULT 0.5,
  source VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE twin_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twin_id UUID NOT NULL REFERENCES ai_twins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  interaction_type VARCHAR(50) NOT NULL,
  input_text TEXT,
  output_text TEXT,
  confidence_score DECIMAL(5,2),
  was_escalated BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE twin_training_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twin_id UUID NOT NULL REFERENCES ai_twins(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  data_sources JSONB DEFAULT '[]',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEETINGS
-- ============================================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(500),
  platform VARCHAR(50),
  external_meeting_id VARCHAR(255),
  meeting_url TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  transcript TEXT,
  raw_transcript JSONB,
  audio_file_url TEXT,
  summary TEXT,
  key_decisions TEXT[],
  sentiment_score DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  twin_id UUID REFERENCES ai_twins(id),
  participant_type VARCHAR(50) DEFAULT 'human',
  role VARCHAR(50) DEFAULT 'attendee',
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  speaking_time_seconds INTEGER DEFAULT 0
);

CREATE TABLE meeting_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  twin_id UUID REFERENCES ai_twins(id),
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general',
  timestamp_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KNOWLEDGE BASE (RAG)
-- ============================================================
CREATE TABLE knowledge_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  connection_config JSONB DEFAULT '{}',
  sync_status VARCHAR(50) DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  total_documents INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  external_id VARCHAR(500),
  title VARCHAR(1000),
  content TEXT,
  content_hash VARCHAR(64),
  file_url TEXT,
  file_type VARCHAR(50),
  file_size_bytes INTEGER,
  metadata JSONB DEFAULT '{}',
  is_indexed BOOLEAN DEFAULT FALSE,
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  qdrant_point_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMAIL INTELLIGENCE
-- ============================================================
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_address VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  sync_status VARCHAR(50) DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  total_emails_processed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  external_thread_id VARCHAR(500),
  subject VARCHAR(1000),
  participants JSONB DEFAULT '[]',
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  category VARCHAR(100),
  sentiment VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  twin_id UUID NOT NULL REFERENCES ai_twins(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id),
  subject VARCHAR(1000),
  to_addresses JSONB DEFAULT '[]',
  cc_addresses JSONB DEFAULT '[]',
  body TEXT NOT NULL,
  tone VARCHAR(50) DEFAULT 'professional',
  confidence_score DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'draft',
  approved_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTEGRATIONS
-- ============================================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_type VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  config JSONB DEFAULT '{}',
  credentials_encrypted TEXT,
  status VARCHAR(50) DEFAULT 'inactive',
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS & BILLING
-- ============================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  max_employees INTEGER,
  max_twins INTEGER,
  max_meetings_per_month INTEGER,
  max_storage_gb INTEGER,
  features JSONB DEFAULT '[]',
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'trialing',
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  seats_purchased INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_invoice_id VARCHAR(255) UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'draft',
  invoice_pdf_url TEXT,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  line_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  twin_id UUID REFERENCES ai_twins(id),
  usage_type VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  unit VARCHAR(50),
  cost_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(200) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  old_values JSONB,
  new_values JSONB,
  status VARCHAR(50) DEFAULT 'success',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- API KEYS
-- ============================================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  scopes JSONB DEFAULT '[]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WEBHOOKS
-- ============================================================
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events JSONB DEFAULT '[]',
  secret_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS SNAPSHOTS
-- ============================================================
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  active_users INTEGER DEFAULT 0,
  active_twins INTEGER DEFAULT 0,
  meetings_held INTEGER DEFAULT 0,
  emails_processed INTEGER DEFAULT 0,
  knowledge_queries INTEGER DEFAULT 0,
  twin_interactions INTEGER DEFAULT 0,
  hours_saved DECIMAL(10,2) DEFAULT 0,
  tasks_automated INTEGER DEFAULT 0,
  mrr_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, snapshot_date)
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_supabase_auth ON users(supabase_auth_id);
CREATE INDEX idx_twins_user ON ai_twins(user_id);
CREATE INDEX idx_twins_org ON ai_twins(organization_id);
CREATE INDEX idx_twin_memories_twin ON twin_memories(twin_id);
CREATE INDEX idx_twin_interactions_twin ON twin_interactions(twin_id, created_at DESC);
CREATE INDEX idx_twin_training_jobs_twin ON twin_training_jobs(twin_id);
CREATE INDEX idx_meetings_org ON meetings(organization_id);
CREATE INDEX idx_meetings_created_by ON meetings(created_by);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_knowledge_chunks_doc ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_docs_org ON knowledge_documents(organization_id);
CREATE INDEX idx_knowledge_docs_source ON knowledge_documents(source_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_usage_records_org ON usage_records(organization_id, recorded_at);
CREATE INDEX idx_email_threads_account ON email_threads(email_account_id);
CREATE INDEX idx_email_drafts_twin ON email_drafts(twin_id);
CREATE INDEX idx_integrations_org ON integrations(organization_id);

-- Full-text search on knowledge documents
CREATE INDEX idx_knowledge_docs_fts ON knowledge_documents USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teams_updated BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_twins_updated BEFORE UPDATE ON ai_twins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_meetings_updated BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_knowledge_sources_updated BEFORE UPDATE ON knowledge_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_knowledge_docs_updated BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_integrations_updated BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_meeting_action_items_updated BEFORE UPDATE ON meeting_action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Helper function: resolve org id from Supabase JWT
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE supabase_auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY org_isolation_users ON users
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_teams ON teams
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_team_members ON team_members
  USING (team_id IN (SELECT id FROM teams WHERE organization_id = current_org_id()));

CREATE POLICY org_isolation_twins ON ai_twins
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_twin_memories ON twin_memories
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_twin_interactions ON twin_interactions
  USING (twin_id IN (SELECT id FROM ai_twins WHERE organization_id = current_org_id()));

CREATE POLICY org_isolation_meetings ON meetings
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_meeting_participants ON meeting_participants
  USING (meeting_id IN (SELECT id FROM meetings WHERE organization_id = current_org_id()));

CREATE POLICY org_isolation_meeting_actions ON meeting_action_items
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_knowledge_sources ON knowledge_sources
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_knowledge_docs ON knowledge_documents
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_email_accounts ON email_accounts
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_email_threads ON email_threads
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_email_drafts ON email_drafts
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_integrations ON integrations
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_subscriptions ON subscriptions
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_invoices ON invoices
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_usage ON usage_records
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_audit ON audit_logs
  USING (organization_id = current_org_id());

CREATE POLICY own_notifications ON notifications
  USING (user_id = (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY org_isolation_api_keys ON api_keys
  USING (organization_id = current_org_id());

CREATE POLICY org_isolation_webhooks ON webhooks
  USING (organization_id = current_org_id());

-- Service role bypasses RLS for backend operations
-- (Supabase service_role key automatically bypasses all RLS policies)

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_employees, max_twins, max_meetings_per_month, max_storage_gb, features) VALUES
  ('Starter', 'starter', 'Perfect for small teams getting started with AI twins', 30.00, 288.00, 10, 10, 5, 10,
   '["Basic Twin","5 meetings/mo","1 knowledge source","Email drafts","Standard support"]'),
  ('Professional', 'professional', 'For growing teams that need advanced AI capabilities', 40.00, 384.00, 100, 100, 50, 100,
   '["Advanced Twin","50 meetings/mo","10 knowledge sources","Email intelligence","Analytics","Priority support"]'),
  ('Enterprise', 'enterprise', 'Unlimited scale with enterprise security and compliance', 50.00, 480.00, -1, -1, -1, -1,
   '["Full Twin","Unlimited meetings","Unlimited sources","SSO/SAML","On-premise","Custom SLA","Dedicated CSM"]');

INSERT INTO roles (name, is_system, permissions) VALUES
  ('owner',    TRUE, '["*"]'),
  ('admin',    TRUE, '["read:*","write:*","delete:users","manage:billing","manage:integrations"]'),
  ('manager',  TRUE, '["read:*","write:twins","write:meetings","read:analytics","invite:members"]'),
  ('employee', TRUE, '["read:own","write:own","use:twin","read:meetings"]');
