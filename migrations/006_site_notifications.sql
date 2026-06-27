-- Migration 006 : Notifications in-app (cloche site)
-- Owner : Site API
-- Distinct de la table `notifications` (file bot → Discord)

CREATE TABLE IF NOT EXISTS site_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_discord_id VARCHAR(20) NULL,
  target_roster_role_id VARCHAR(20) NULL,
  type ENUM('vod', 'strat', 'objective', 'system') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255) NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_recipient (recipient_discord_id, is_read, created_at DESC),
  INDEX idx_notif_roster (target_roster_role_id, is_read)
);
