-- Migration 009 : Pseudo d'affichage + annonces site (transmissions) + lectures par membre

ALTER TABLE users
  ADD COLUMN display_name VARCHAR(50) NULL AFTER username;

CREATE TABLE IF NOT EXISTS site_announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_discord_id VARCHAR(20) NOT NULL,
  author_display_name VARCHAR(50) NOT NULL,
  author_avatar_url VARCHAR(255) NULL,
  author_role_label VARCHAR(50) NOT NULL,
  author_role_color VARCHAR(7) NOT NULL DEFAULT '#c4b5fd',
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_announcements_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_announcement_reads (
  discord_id VARCHAR(20) NOT NULL,
  announcement_id INT NOT NULL,
  read_version INT NOT NULL DEFAULT 1,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (discord_id, announcement_id),
  CONSTRAINT fk_ann_reads_ann
    FOREIGN KEY (announcement_id) REFERENCES site_announcements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_notification_reads (
  discord_id VARCHAR(20) NOT NULL,
  notification_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (discord_id, notification_id),
  CONSTRAINT fk_notif_reads_notif
    FOREIGN KEY (notification_id) REFERENCES site_notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
