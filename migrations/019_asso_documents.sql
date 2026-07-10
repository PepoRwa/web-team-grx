-- Migration 019 : Documents asso (métadonnées MySQL + fichiers Supabase Storage)
-- Permissions par module + grants dossier « sur demande »

CREATE TABLE IF NOT EXISTS asso_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder ENUM('statuts', 'pv_ag', 'pv_bureau', 'conventions', 'interne') NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  uploaded_by_discord_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_asso_docs_folder (folder, created_at DESC),
  INDEX idx_asso_docs_active (deleted_at, folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions fines par module (documents, etc.)
CREATE TABLE IF NOT EXISTS asso_module_permissions (
  discord_id VARCHAR(20) NOT NULL,
  module ENUM('documents') NOT NULL,
  access_level ENUM('aucun', 'lecture', 'edition', 'admin') NOT NULL DEFAULT 'aucun',
  granted_by_discord_id VARCHAR(20) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (discord_id, module),
  INDEX idx_asso_module_perm_level (module, access_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Accès temporaire / sur demande à un dossier (pv_ag, pv_bureau)
CREATE TABLE IF NOT EXISTS asso_document_folder_grants (
  discord_id VARCHAR(20) NOT NULL,
  folder ENUM('pv_ag', 'pv_bureau') NOT NULL,
  granted_by_discord_id VARCHAR(20) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (discord_id, folder),
  INDEX idx_asso_doc_folder_grant (folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
