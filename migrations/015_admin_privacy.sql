-- Migration 015 : conformité RGPD + panneau fondateur
-- Owner : Site API
-- - email : stocké pour responsabilité (récupéré du JWT Supabase)
-- - is_disabled : kill-switch d'accès indépendant des rôles Discord
-- - admin_audit_log : traçabilité des actions sensibles (RGPD accountability)

ALTER TABLE users
  ADD COLUMN email VARCHAR(320) NULL AFTER supabase_user_id,
  ADD COLUMN email_updated_at TIMESTAMP NULL AFTER email,
  ADD COLUMN last_login_at TIMESTAMP NULL AFTER updated_at,
  ADD COLUMN is_disabled TINYINT(1) NOT NULL DEFAULT 0 AFTER onboarding_completed_at,
  ADD COLUMN disabled_at TIMESTAMP NULL AFTER is_disabled,
  ADD COLUMN disabled_by_discord_id VARCHAR(20) NULL AFTER disabled_at,
  ADD COLUMN disabled_reason VARCHAR(255) NULL AFTER disabled_by_discord_id;

CREATE INDEX idx_users_disabled ON users (is_disabled);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_discord_id VARCHAR(20) NOT NULL,
  action VARCHAR(60) NOT NULL,
  target_discord_id VARCHAR(20) NULL,
  detail JSON NULL,
  ip_hash VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_actor (actor_discord_id, created_at DESC),
  INDEX idx_audit_target (target_discord_id, created_at DESC),
  INDEX idx_audit_action (action, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
