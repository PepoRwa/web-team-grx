-- Migration 016 : dédup de l'alerte "nouvelle inscription" (exactly-once)
-- Owner : Site API
-- signup_notified = 0 par défaut ; passé à 1 atomiquement lors de l'envoi de
-- l'alerte, ce qui garantit un seul message Discord par compte, quels que
-- soient les appels de synchronisation concurrents.
-- Les comptes existants (default 0) ne déclenchent rien : l'alerte n'est
-- appelée que lors d'une PREMIÈRE insertion (nouveau compte).

ALTER TABLE users
  ADD COLUMN signup_notified TINYINT(1) NOT NULL DEFAULT 0 AFTER last_login_at;
