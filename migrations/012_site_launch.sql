-- Migration 012 : Mode launch (countdown → célébration → live)
-- opens_at en UTC : 2026-06-27 17:30:00 = 19h30 Europe/Paris (CEST)

CREATE TABLE IF NOT EXISTS site_launch (
  id INT PRIMARY KEY DEFAULT 1,
  opens_at TIMESTAMP NOT NULL,
  celebration_minutes INT NOT NULL DEFAULT 5,
  ceo_message_title VARCHAR(200) NULL,
  ceo_message_body TEXT NULL,
  manual_unlock TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO site_launch (
  id,
  opens_at,
  celebration_minutes,
  ceo_message_title,
  ceo_message_body,
  manual_unlock,
  is_active
) VALUES (
  1,
  '2026-06-27 17:30:00',
  5,
  'Un mot de Nel',
  'On y est, avec l''association qui se prépare, l''heure est venue d''aussi remettre à jours nos outils. Car soit ça rencontrait trop d''erreurs soit rien ne marchait. Alors voilà. Le premier d''une petite série de reworks (qui je l''espère seront les derniers). Le hub staff sera désormais à vous, j''espère que vous prendrez plaisir à vous en servir. Merci à tous pour cette confiance énorme que vous placez en moi et en ce projet. je n''oublierai jamais ces moments. A très vite, Nel',
  0,
  1
)
ON DUPLICATE KEY UPDATE id = id;
