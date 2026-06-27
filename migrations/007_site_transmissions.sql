-- Migration 007 : Transmissions (templates messages staff)
-- Owner : Site API
-- Envoi effectif → INSERT table `notifications` (bot Discord)

CREATE TABLE IF NOT EXISTS transmission_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_by_discord_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_templates_author (created_by_discord_id)
);

-- Webhooks Discord : config serveur (.env API ou table admin future)
-- Pas d'URLs webhook stockées en clair accessible client
