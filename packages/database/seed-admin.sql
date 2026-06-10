-- ============================================================
-- TwinForce Super Admin Setup
-- Run this in Supabase SQL Editor AFTER running schema.sql
-- ============================================================

-- Step 1: Seed subscription plans (if not already present)
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_employees, max_twins, features)
VALUES
  ('Starter',      'starter',      'Perfect for small teams',       30,  288,  10,   10,  '["Basic Twin","5 meetings/mo","1 knowledge source"]'),
  ('Professional', 'professional', 'For growing organizations',     40,  384,  100,  100, '["Advanced Twin","50 meetings/mo","10 knowledge sources","Email intelligence"]'),
  ('Enterprise',   'enterprise',   'Unlimited scale with SLA',      50,  480,  -1,   -1,  '["Full Twin","Unlimited meetings","Unlimited sources","SSO","On-premise","SLA"]')
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Create system organization for super admin
-- This org will NOT appear in the admin dashboard (filtered by plan='system')
INSERT INTO organizations (id, name, slug, plan, status, max_employees)
VALUES (
  gen_random_uuid(),
  'TwinForce System',
  'twinforce-system-internal',
  'system',
  'active',
  -1
)
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Create the Supabase auth user
-- Go to: Supabase Dashboard → Authentication → Users → Add User
--   Email: admin@twinforce.ai
--   Password: TwinForce@Admin2025!
--   Click "Create User" and copy the UUID it shows

-- Step 4: Replace SUPABASE_AUTH_UUID_HERE with the UUID you just copied,
--         then run this INSERT.
--         The system_org_id is auto-resolved from the org we created above.

DO $$
DECLARE
  v_org_id UUID;
  v_supabase_id UUID := NULL; -- Replace NULL with the UUID from Supabase auth if you created one
BEGIN
  -- Get the system org id
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'twinforce-system-internal' LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'System organization not found. Did the INSERT above run?';
  END IF;

  -- Create the super admin user record
  -- The password hash below is bcrypt of 'TwinForce@Admin2025!' with cost=12
  -- You can regenerate with: node -e "const b=require('bcryptjs');b.hash('TwinForce@Admin2025!',12).then(console.log)"
  INSERT INTO users (
    id,
    organization_id,
    supabase_auth_id,
    email,
    full_name,
    role,
    status,
    onboarding_completed,
    metadata
  ) VALUES (
    gen_random_uuid(),
    v_org_id,
    v_supabase_id,  -- Set to the Supabase auth UUID if you created one
    'admin@twinforce.ai',
    'TwinForce Super Admin',
    'super_admin',
    'active',
    TRUE,
    '{"passwordHash": "$2b$12$PLACEHOLDER_REPLACE_WITH_REAL_HASH"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE '✅ Super admin created. Email: admin@twinforce.ai';
  RAISE NOTICE '⚠️  IMPORTANT: The password hash above is a placeholder.';
  RAISE NOTICE '   Run the seed-admin script instead for a working password hash:';
  RAISE NOTICE '   cd apps/api && bun run seed-admin';
END $$;

-- ============================================================
-- RECOMMENDED: Use the Bun seeder instead of this SQL
-- It automatically hashes the password correctly.
--
-- cd apps/api
-- bun run seed-admin
--
-- This will:
--   1. Create the system organization
--   2. Hash TwinForce@Admin2025! with bcrypt cost=12
--   3. Create the super_admin user record
--   4. Try to create a Supabase auth user (non-fatal)
--   5. Print login credentials
-- ============================================================
