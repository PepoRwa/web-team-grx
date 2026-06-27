-- Migration 010 : Annonces "premier plan" (popup à la connexion)

ALTER TABLE site_announcements
  ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER body;

CREATE INDEX idx_announcements_featured ON site_announcements (is_featured, created_at DESC);
