1. Le calcul de l'IA (Le "Score de Crédibilité")
L'idée de ne pas descendre en dessous de 0 est essentielle. Pour éviter de "bouffer des tokens" ou de payer trop cher en API, voici une stratégie hybride :

Phase 1 (Calcul déterministe) : Un script JS local calcule le score basé sur le Tracker, l'âge, les absences et les mains agents. (Coût : 0 token).

Phase 2 (IA - NLP) : Tu envoies uniquement le texte de motivation et le mode de jeu à une API (Gemini est une excellente idée car ils ont un "Free Tier" généreux). Elle analyse le ton (arrogant vs déterminé) et cherche les mots-clés.

Phase 3 (Alternative ultra-light) : Si tu veux 0 token, tu utilises une bibliothèque comme sentiment (Node.js) pour l'analyse de texte et une "Regex" évolutive pour tes banques de mots-clés.





Généré par Gemini -

Suggéré par Claude: 
Voilà une architecture 100% locale, zéro token, zéro sous-traitant externe, zéro risque RGPD :

---

## Architecture Slow Bloom — Full Local, RGPD Native

### Phase 1 — Calcul déterministe (JS local, coût 0)

Tout ce qui est objectivement mesurable sans IA :

- **Rank Valorant** → score selon seuils définis (Ascendant = X pts, Immortal = Y pts, etc.)
- **Âge** → vérification éligibilité uniquement, donnée non stockée après
- **Taux de présence** → calcul pondéré : absence non justifiée × 3, absence justifiée × 1, présence × points positifs
- **Roster source → Roster cible** → vérification éligibilité du transfert, points selon cohérence
- **Agents mains** → comparaison avec les besoins du roster cible, bonus/malus selon fit
- **Planning de disponibilité** → score selon couverture des créneaux d'entraînement

**Librairies suggérées** : pur JS vanilla ou une lib de scoring maison. Zéro dépendance externe.

---

### Phase 2 — NLP local (zéro API, zéro token)

Pour l'analyse du texte de motivation et du mode de jeu, tout se fait côté serveur Supabase Edge Functions ou en JS :

**Analyse de mots-clés** → une banque de mots évolutive stockée en base, organisée en catégories :
```
mots_positifs_gowrax: ["collectif", "progression", "engagement", "équipe"...]
mots_negatifs: ["easy", "meilleur", "je suis", "je veux juste"...]
mots_arrogance: ["inarrêtable", "carry", "les autres"...]
mots_determination: ["travailler", "améliorer", "apprendre"...]
```

**Analyse de sentiment** → librairie `sentiment` (Node.js, open source, zéro token) ou `natural` pour une analyse plus fine. Les deux tournent 100% en local.

**Score de tonalité** → basé sur le ratio mots positifs / négatifs + présence de patterns d'arrogance. Les notes ne descendent jamais en dessous de 0.

---

### Phase 3 — Sécurité & limites

- **Scores plafonnés** entre 0 et 100
- **Banque de mots évolutive** : le staff peut ajouter / retirer des mots directement depuis l'interface admin, sans toucher au code
- **Logs d'analyse** : jamais le texte brut — uniquement les scores et catégories détectées. Conformité RGPD native.
- **Transparence membre** : avant soumission, affichage clair que le texte est analysé localement par un système automatisé avant lecture par le staff

---

### Ce que ça change côté RGPD

Zéro sous-traitant externe à déclarer pour l'IA. Gemini, OpenAI, Anthropic — aucun. Les textes de motivation ne quittent jamais ton infrastructure (Supabase EU). La banque de mots est une donnée interne, pas un modèle tiers. Dans le RGPD on écrira juste "analyse automatisée réalisée localement sur l'infrastructure Supabase EU — aucun transfert vers un service tiers."

---

### Bonus — "Powered by Gowrax AI"

Le badge dans l'interface reste totalement légitime. C'est ton système, tes règles, ton scoring. L'appeler "Gowrax AI" c'est exact — c'est une IA maison, pas une IA louée. Et ça évite toute question sur "quelle entreprise analyse mes données".

---

La seule concession : l'analyse sémantique sera moins nuancée qu'un vrai LLM. Mais pour détecter l'arrogance vs la détermination dans un texte de 300 mots avec une banque de mots bien construite, c'est largement suffisant. Et t'as la main dessus à 100%.