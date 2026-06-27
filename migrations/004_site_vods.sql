-- Migration 004 : VODs & commentaires débrief
-- Owner : Site API
-- Migration données : 30 VODs depuis Supabase Gowrax-Internal

CREATE TABLE IF NOT EXISTS vods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_discord_id VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  link VARCHAR(500) NOT NULL,
  map VARCHAR(50) NOT NULL,
  match_date DATE NOT NULL,
  status ENUM('win', 'loss', 'draw') NOT NULL,
  score VARCHAR(20) NOT NULL,
  opponent VARCHAR(100) NULL,
  is_pro TINYINT(1) DEFAULT 0,
  description_pro TEXT NULL,
  players_present JSON NULL,
  reviewed_at TIMESTAMP NULL,
  reviewed_by_discord_id VARCHAR(20) NULL,
  notify_discord TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vods_author (author_discord_id),
  INDEX idx_vods_pro (is_pro),
  INDEX idx_vods_date (match_date DESC)
);

CREATE TABLE IF NOT EXISTS vod_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vod_id INT NOT NULL,
  author_discord_id VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  is_private TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vod_id) REFERENCES vods(id) ON DELETE CASCADE,
  INDEX idx_comments_vod (vod_id)
);
