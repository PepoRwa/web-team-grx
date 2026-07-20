-- Demande de suppression compte + échéance d'anonymisation (RGPD)
-- Accès coupé immédiatement (is_disabled) ; données asso/PII anonymisées à échéance (~6 mois).

ALTER TABLE users
  ADD COLUMN deletion_requested_at TIMESTAMP NULL AFTER disabled_reason,
  ADD COLUMN deletion_scheduled_at TIMESTAMP NULL AFTER deletion_requested_at,
  ADD COLUMN anonymized_at TIMESTAMP NULL AFTER deletion_scheduled_at;

CREATE INDEX idx_users_deletion_scheduled ON users (deletion_scheduled_at, is_disabled, anonymized_at);
