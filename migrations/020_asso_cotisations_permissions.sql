-- Migration 020 : permissions modules asso (enum complet — évite conflit si données déjà importées)

ALTER TABLE asso_module_permissions
  MODIFY module ENUM('membres', 'documents', 'cotisations', 'assemblees', 'parametres') NOT NULL;
