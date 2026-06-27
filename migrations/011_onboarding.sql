-- Migration 011 : Onboarding first-login terminé

ALTER TABLE users
  ADD COLUMN onboarding_completed_at TIMESTAMP NULL AFTER notify_strat_dm;

-- Membres déjà configurés avant cette feature
UPDATE users
SET onboarding_completed_at = COALESCE(updated_at, created_at)
WHERE display_name IS NOT NULL AND onboarding_completed_at IS NULL;
