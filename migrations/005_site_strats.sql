-- Migration 005 : Strat-Book
-- Owner : Site API
-- Images stockées sur Supabase Storage (path référencé ici)

CREATE TABLE IF NOT EXISTS strats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  map VARCHAR(50) NOT NULL,
  side ENUM('attack', 'defense') NOT NULL,
  valoplant_url VARCHAR(500) NULL,
  vod_url VARCHAR(500) NULL,
  image_path VARCHAR(255) NULL,
  author_discord_id VARCHAR(20) NOT NULL,
  status ENUM('published', 'proposed') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_strats_map (map),
  INDEX idx_strats_side (side),
  INDEX idx_strats_status (status),
  INDEX idx_strats_author (author_discord_id)
);
