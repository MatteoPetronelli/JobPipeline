---
name: batch-filter
description: Analyse des offres d'emploi par lots via l'API Z.ai (GLM-5.2) pour éliminer les offres non-pertinentes.
---

# Skill: Batch Filter

## Commandes
`/batch-process`

## Directives d'Exécution
1. **Batching Stratégique** : Regrouper jusqu'à 20 offres (`rawDescription`) dans un seul tableau JSON pour réduire le nombre d'appels API.
2. **Modèle Cible** : Utiliser `glm-5.2` pour son ratio performance/coût optimal sur du text-matching strict.
3. **Prompting Strict** : Injecter le `filter-template.json` dans le System Prompt.
4. **Validation de Sortie** : Z.ai doit répondre UNIQUEMENT avec un tableau JSON contenant les IDs des offres validées et la raison du rejet pour les autres.
5. **Mise à jour d'état** :
   - Les offres validées passent au statut `APPROVED_BY_ZAI`.
   - Les autres passent à `REJECTED_BY_ZAI` (avec le motif).
