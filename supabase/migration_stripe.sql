-- ============================================================================
-- MIGRATION: Stripe Connect Onboarding
-- Ausführen in: Supabase Dashboard → SQL Editor
-- stripe_account_id war bereits im Initialschema vorhanden (IF NOT EXISTS sicher)
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id         text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;
