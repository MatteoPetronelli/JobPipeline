---
description: Récolte nocturne d'offres d'emploi via scraping Playwright et insertion en base locale
---

# Workflow : Daily Harvest

## Phase 1 : Initialisation
1. Déclencher le script chaque jour à 23h00.
2. Exécuter db:validate pour valider la structure de la base SQLite.

## Phase 2 : Scraping
1. Activer job-scraper sur la liste des plateformes cibles.
2. Appliquer la temporisation du rate-limiter pour éviter les bannissements IP.

## Phase 3 : Stockage
1. Formater chaque annonce selon selectors-schema.json.
2. Générer le hashId via SHA-256 de la chaîne composée de l'URL et du nom de l'entreprise.
3. Insérer en base de données avec le statut NEW.
4. Ignorer silencieusement si le hashId existe déjà.

## Phase 4 : Clôture
1. Enregistrer le nombre d'offres ajoutées aujourd'hui dans les logs.
2. Fermer le contexte du navigateur Playwright.
