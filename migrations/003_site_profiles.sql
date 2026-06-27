-- Migration 003 : Profils utilisateurs (extension table users)
-- Owner : Site API

ALTER TABLE users
  ADD COLUMN tracker_url VARCHAR(255) NULL AFTER avatar_url,
  ADD COLUMN riot_id VARCHAR(50) NULL AFTER tracker_url,
  ADD COLUMN steam_id VARCHAR(50) NULL AFTER riot_id,
  ADD COLUMN game ENUM('valorant', 'cs2', 'other') DEFAULT 'valorant' AFTER steam_id,
  ADD COLUMN notify_vod_dm TINYINT(1) DEFAULT 1 AFTER game,
  ADD COLUMN notify_strat_dm TINYINT(1) DEFAULT 1 AFTER notify_vod_dm;
