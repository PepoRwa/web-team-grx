-- Migration 016 : dedup de l'alerte nouvelle inscription (exactly-once)
-- Owner : Site API
-- signup_notified vaut 0 par defaut et passe a 1 de facon atomique a l'envoi
-- de l'alerte, ce qui garantit un seul message Discord par compte meme si la
-- synchro est appelee plusieurs fois en parallele.
-- Les comptes existants (defaut 0) ne declenchent rien : l'alerte n'est
-- appelee que lors d'une PREMIERE insertion (nouveau compte).

ALTER TABLE users
  ADD COLUMN signup_notified TINYINT(1) NOT NULL DEFAULT 0 AFTER last_login_at;
