-- Migration 018 : Module asso (dossiers adhérents, liaison Discord, accès site)
-- Owner : Site API
-- IMPORTANT : asso_dossiers.tracker_url ≠ users.tracker_url (profil team esport)

CREATE TABLE IF NOT EXISTS asso_dossiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discord_id VARCHAR(20) NULL,
  site_access TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('actif', 'inactif') NOT NULL DEFAULT 'actif',
  linked_at TIMESTAMP NULL,
  linked_by_discord_id VARCHAR(20) NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  pseudo VARCHAR(80) NOT NULL,
  email VARCHAR(320) NULL,
  phone VARCHAR(40) NULL,
  -- Tracker dossier asso (jamais synchronisé avec users.tracker_url)
  tracker_url VARCHAR(500) NULL,
  riot_id VARCHAR(64) NULL,
  discord_pseudo VARCHAR(100) NULL,
  date_of_birth DATE NULL,
  birth_place VARCHAR(120) NULL,
  nationality VARCHAR(80) NULL,
  residence_country VARCHAR(80) NULL,
  cotisation_type ENUM('complete', 'partielle', 'dispense') NOT NULL DEFAULT 'complete',
  cotisation_status ENUM('paye', 'en_attente', 'expire', 'dispense') NOT NULL DEFAULT 'en_attente',
  cotisation_exemption_ref VARCHAR(120) NULL,
  cotisation_exemption_note TEXT NULL,
  structure_roles JSON NULL,
  charte_accepted_at TIMESTAMP NULL,
  charte_version VARCHAR(40) NULL,
  legal_guardian JSON NULL,
  adhesion_renewed_at TIMESTAMP NULL,
  deletion_requested_at TIMESTAMP NULL,
  deletion_request_note TEXT NULL,
  joined_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asso_dossiers_discord (discord_id),
  INDEX idx_asso_dossiers_status (status, site_access),
  INDEX idx_asso_dossiers_pseudo (pseudo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bureau autorisé à gérer le module asso (en plus du fondateur)
CREATE TABLE IF NOT EXISTS asso_bureau_grants (
  discord_id VARCHAR(20) PRIMARY KEY,
  granted_by_discord_id VARCHAR(20) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
