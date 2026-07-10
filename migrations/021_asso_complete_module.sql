-- Migration 021 : Assemblées, paramètres asso

CREATE TABLE IF NOT EXISTS asso_settings (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  settings_json JSON NOT NULL,
  updated_by_discord_id VARCHAR(20) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asso_assemblies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  assembly_date DATE NOT NULL,
  agenda JSON NOT NULL,
  status ENUM('a_venir', 'terminee') NOT NULL DEFAULT 'a_venir',
  pv_document_id INT NULL,
  created_by_discord_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_asso_assemblies_date (assembly_date DESC),
  CONSTRAINT fk_asso_assembly_pv FOREIGN KEY (pv_document_id)
    REFERENCES asso_documents (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO asso_settings (id, settings_json)
VALUES (1, JSON_OBJECT(
  'name', 'Gowrax',
  'tagline', 'Association esport',
  'fiscalYear', YEAR(CURDATE()),
  'email', 'teamgowrax@gmail.com',
  'country', 'France'
));
