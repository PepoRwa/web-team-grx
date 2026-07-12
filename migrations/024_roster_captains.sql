-- Capitaines par roster (source de vérité site + bot)
-- Un capitaine désigné par roster ; indépendant du rôle Discord décoratif « Capitaine ».

CREATE TABLE IF NOT EXISTS roster_captains (
  target_roster ENUM('high_roster', 'game_changers', 'high_roster_cs2') NOT NULL,
  discord_id VARCHAR(20) NOT NULL,
  assigned_by_discord_id VARCHAR(20) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (target_roster),
  INDEX idx_roster_captains_discord (discord_id)
);
