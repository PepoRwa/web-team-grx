-- Migration 008 : Bandeau objectif de saison (optionnel)
-- Owner : Site API
-- Si is_visible = 0 ou title NULL → bandeau masqué

CREATE TABLE IF NOT EXISTS season_banner (
  id INT PRIMARY KEY DEFAULT 1,
  title VARCHAR(200) NULL,
  description TEXT NULL,
  deadline DATE NULL,
  icon VARCHAR(50) NULL,
  is_visible TINYINT(1) DEFAULT 0,
  updated_by_discord_id VARCHAR(20) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO season_banner (id, is_visible) VALUES (1, 0)
ON DUPLICATE KEY UPDATE id = id;
