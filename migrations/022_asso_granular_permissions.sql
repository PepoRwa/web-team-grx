-- Migration 022 : Rôles bureau granulaires + permissions par document (plus de groupes dossier)

-- Rôle bureau (remplace le grant binaire)
ALTER TABLE asso_bureau_grants
  ADD COLUMN role ENUM('president', 'secretaire', 'tresorier', 'membre_bureau')
    NOT NULL DEFAULT 'membre_bureau'
    AFTER discord_id;

-- Accès individuel par document (lecture ou édition)
CREATE TABLE IF NOT EXISTS asso_document_grants (
  discord_id VARCHAR(20) NOT NULL,
  document_id INT NOT NULL,
  access_level ENUM('lecture', 'edition') NOT NULL DEFAULT 'lecture',
  granted_by_discord_id VARCHAR(20) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (discord_id, document_id),
  INDEX idx_asso_doc_grant_document (document_id),
  CONSTRAINT fk_asso_doc_grant_document
    FOREIGN KEY (document_id) REFERENCES asso_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
