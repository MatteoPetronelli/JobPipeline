# Persistance de l'État (state-management.md)

## 1. Objectif du State Manager
Empêcher catégoriquement le traitement redondant. Un étudiant d'élite ne spamme jamais deux fois le même employeur pour la même annonce.

## 2. Modèle d'État Universel (Job Entity)
Chaque job extrait par le scraper reçoit un hash unique (`id` généré à partir de l'URL et du nom de l'entreprise).
Son cycle de vie est strict et unidirectionnel :

`NEW` -> `FILTERING` -> `APPROVED_BY_ZAI` -> `PROMPT_GENERATED` -> `READY_FOR_HUMAN` -> `SENT`

- États de rejet : `REJECTED_BY_CODE`, `REJECTED_BY_ZAI`, `HUMAN_ABORTED`.
- États d'erreur : `ERROR_SCRAPING`, `ERROR_EMAIL`.

## 3. Implémentation Locale
- SQLite est la base de données standardisée.
- À chaque démarrage d'un workflow, le système lit le state actuel pour savoir exactement où reprendre. (Idempotence).
- Les opérations de lecture/écriture DB doivent être encapsulées dans des transactions pour garantir la cohérence en cas de crash intempestif de l'app.
