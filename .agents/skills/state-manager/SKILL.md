---
name: state-manager
description: Gère la base de données locale (SQLite) pour garantir l'idempotence et tracer le cycle de vie de chaque offre d'emploi.
---

# Skill: State Manager

## Commandes
`/manage-state [action]`

## Directives d'Exécution
1. **Source de Vérité** : Le fichier `.sqlite` (local et ignoré par Git) est la seule source de vérité du pipeline.
2. **Identification Unique** : Chaque offre génère un `hashId` calculé via SHA-256 sur la combinaison `(url + companyName)`. Cela empêche d'insérer des doublons même si l'URL varie légèrement (tracking params).
3. **Transitions d'État Autorisées** :
   - `NEW` -> `FILTERING`
   - `FILTERING` -> `APPROVED_BY_ZAI` ou `REJECTED_BY_ZAI`
   - `APPROVED_BY_ZAI` -> `PROMPT_GENERATED`
   - `PROMPT_GENERATED` -> `READY_FOR_HUMAN`
   - `READY_FOR_HUMAN` -> `SENT` ou `HUMAN_ABORTED`
4. **Opérations Atomiques** : Toutes les modifications (UPDATE) doivent se faire dans une transaction pour éviter un état incohérent en cas de coupure de courant ou de crash réseau.
