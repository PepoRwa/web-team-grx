-- Migration 017 : Try Outs — suivi recrutement interne
-- Owner : Site API

CREATE TABLE IF NOT EXISTS tryout_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  game ENUM('valorant', 'cs2', 'other') NOT NULL DEFAULT 'valorant',
  target_roster ENUM('high_roster', 'game_changers', 'high_roster_cs2') NOT NULL,
  status ENUM('draft', 'active', 'closed') NOT NULL DEFAULT 'draft',
  start_date DATE NULL,
  end_date DATE NULL,
  slots_target TINYINT UNSIGNED NULL,
  notes TEXT NULL,
  created_by_discord_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tryout_campaigns_status (status),
  INDEX idx_tryout_campaigns_roster (target_roster),
  INDEX idx_tryout_campaigns_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tryout_candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  riot_id VARCHAR(64) NOT NULL,
  riot_tag VARCHAR(16) NOT NULL,
  display_name VARCHAR(120) NULL,
  tracker_url VARCHAR(500) NULL,
  discord_id VARCHAR(20) NULL,
  role ENUM('duelist', 'initiator', 'controller', 'sentinel', 'flex') NULL,
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
  source ENUM('discord_ticket', 'referral', 'open_application', 'staff_scout', 'other') NOT NULL DEFAULT 'other',
  notes TEXT NULL,
  created_by_discord_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tryout_candidates_riot (riot_id, riot_tag),
  INDEX idx_tryout_candidates_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tryout_campaign_candidates (
  campaign_id INT NOT NULL,
  candidate_id INT NOT NULL,
  status ENUM(
    'new',
    'contacted',
    'scrim_scheduled',
    'in_trial',
    'shortlist',
    'rejected',
    'offered',
    'joined',
    'withdrawn'
  ) NOT NULL DEFAULT 'new',
  priority TINYINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (campaign_id, candidate_id),
  INDEX idx_tryout_cc_status (status),
  INDEX idx_tryout_cc_candidate (candidate_id),
  CONSTRAINT fk_tryout_cc_campaign
    FOREIGN KEY (campaign_id) REFERENCES tryout_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_tryout_cc_candidate
    FOREIGN KEY (candidate_id) REFERENCES tryout_candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tryout_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  candidate_id INT NOT NULL,
  session_type ENUM('scrim', 'review', 'interview', 'other') NOT NULL DEFAULT 'scrim',
  scheduled_at DATETIME NULL,
  map VARCHAR(50) NULL,
  staff_present JSON NULL,
  vod_id INT NULL,
  outcome ENUM('pending', 'positive', 'neutral', 'negative') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_by_discord_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tryout_sessions_candidate (candidate_id, scheduled_at DESC),
  INDEX idx_tryout_sessions_campaign (campaign_id),
  INDEX idx_tryout_sessions_vod (vod_id),
  CONSTRAINT fk_tryout_sessions_campaign
    FOREIGN KEY (campaign_id) REFERENCES tryout_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_tryout_sessions_candidate
    FOREIGN KEY (candidate_id) REFERENCES tryout_candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tryout_evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  session_id INT NULL,
  evaluator_discord_id VARCHAR(20) NOT NULL,
  scores JSON NULL,
  recommendation ENUM('strong_yes', 'yes', 'neutral', 'no', 'strong_no') NOT NULL DEFAULT 'neutral',
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tryout_evaluations_candidate (candidate_id, created_at DESC),
  CONSTRAINT fk_tryout_evaluations_candidate
    FOREIGN KEY (candidate_id) REFERENCES tryout_candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_tryout_evaluations_session
    FOREIGN KEY (session_id) REFERENCES tryout_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
