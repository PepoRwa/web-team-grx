-- Migration 002 : Sync rôles Discord ↔ site
-- Owner WRITE : Bot Discord
-- Owner READ  : Site API
-- Voir BOT_INTEGRATION.md section 1

CREATE TABLE IF NOT EXISTS discord_roles (
  role_id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('staff', 'roster', 'member', 'decorative') NOT NULL,
  permission_level TINYINT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
  discord_id VARCHAR(20) NOT NULL,
  role_id VARCHAR(20) NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (discord_id, role_id),
  INDEX idx_user_roles_discord (discord_id),
  FOREIGN KEY (role_id) REFERENCES discord_roles(role_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_roles_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discord_id VARCHAR(20) NOT NULL,
  status ENUM('pending', 'done', 'error') DEFAULT 'pending',
  error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  INDEX idx_sync_pending (status, created_at),
  INDEX idx_sync_discord (discord_id)
);

-- Seed rôles Gowrax (IDs Discord officiels)
INSERT INTO discord_roles (role_id, name, category, permission_level) VALUES
  ('1472395939150037165', 'CEO',           'staff',       40),
  ('1472731808121487540', 'Team Manager',  'staff',       30),
  ('1472732049126330451', 'Head Coach',    'staff',       20),
  ('1472734272891785339', 'Coach',         'staff',       10),
  ('1472732829476458659', 'Capitaine',     'decorative',   0),
  ('1474174283424075797', 'High Roster',   'roster',       0),
  ('1511286442721280090', 'Game Changers', 'roster',       0),
  ('1476618903223537697', 'High Roster CS2', 'roster',     0),
  ('1474127750343168247', 'Membre Gowrax', 'member',       0)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  permission_level = VALUES(permission_level);
