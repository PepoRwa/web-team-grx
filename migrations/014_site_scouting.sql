-- Migration 014 : Scouting adverse (tournois, équipes, joueurs)
-- Owner : Site API

CREATE TABLE IF NOT EXISTS scouting_tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  format VARCHAR(120) NULL,
  rules_url VARCHAR(500) NULL,
  notes TEXT NULL,
  created_by_discord_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scouting_tournaments_start (start_date DESC),
  INDEX idx_scouting_tournaments_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scouting_teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  tag VARCHAR(20) NULL,
  notes TEXT NULL,
  created_by_discord_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scouting_teams_name (name),
  INDEX idx_scouting_teams_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scouting_tournament_teams (
  tournament_id INT NOT NULL,
  team_id INT NOT NULL,
  seed VARCHAR(20) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tournament_id, team_id),
  CONSTRAINT fk_scouting_tt_tournament
    FOREIGN KEY (tournament_id) REFERENCES scouting_tournaments(id) ON DELETE CASCADE,
  CONSTRAINT fk_scouting_tt_team
    FOREIGN KEY (team_id) REFERENCES scouting_teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scouting_players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  riot_id VARCHAR(64) NOT NULL,
  riot_tag VARCHAR(16) NOT NULL,
  role ENUM('duelist', 'initiator', 'controller', 'sentinel', 'flex') NULL,
  is_starter TINYINT NULL COMMENT '1=titulaire, 0=remplaçant, NULL=inconnu',
  current_rank VARCHAR(40) NULL,
  peak_rank_current VARCHAR(40) NULL,
  peak_rank_prev VARCHAR(40) NULL,
  end_rank_prev VARCHAR(40) NULL,
  current_rank_value TINYINT UNSIGNED NULL,
  peak_rank_current_value TINYINT UNSIGNED NULL,
  peak_rank_prev_value TINYINT UNSIGNED NULL,
  end_rank_prev_value TINYINT UNSIGNED NULL,
  games_this_season INT UNSIGNED NULL,
  recent_winrate DECIMAL(5, 2) NULL,
  avg_acs DECIMAL(8, 2) NULL,
  avg_kda DECIMAL(6, 2) NULL,
  agent_pool JSON NULL,
  former_team VARCHAR(120) NULL,
  notes TEXT NULL,
  verification_status ENUM('pending', 'verified') NOT NULL DEFAULT 'pending',
  updated_by_discord_id VARCHAR(20) NOT NULL,
  verified_by_discord_id VARCHAR(20) NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_scouting_players_riot (riot_id, riot_tag),
  INDEX idx_scouting_players_team (team_id),
  INDEX idx_scouting_players_status (verification_status),
  CONSTRAINT fk_scouting_players_team
    FOREIGN KEY (team_id) REFERENCES scouting_teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
