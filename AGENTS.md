# Écosystème Vibe Coding : JobPipeline

## 1. Gouvernance du Projet
**Objectif Stratégique :** Déployer une infrastructure automatisée de bout en bout pour l'acquisition d'un contrat d'alternance B3 Fullstack (Année Universitaire 2026-2027) d'élite.
**Règle d'Or :** Automatisation 100% déterministe. Aucune intervention humaine sauf pour la validation finale du mail avant l'envoi.

## 2. Cartographie des Agents et Modules
Cet environnement `.agents/` héberge les règles métier, compétences et workflows pour l'ensemble du cycle de vie des offres :

### 2.1 Règles Globales (`rules/`)
- `architecture.md` : Contraintes de design system (TypeScript, Node.js).
- `code-style.md` : Propreté extrême (No Comments policy).
- `anti-hallucination.md` : Garde-fous contre les dérives IA.
- `security.md` : Protection des PII et des credentials.
- `error-handling.md` : Résilience et Exponential Backoff.
- `state-management.md` : Cycle de vie d'une offre.
- `scraper-resilience.md` : Résilience du scraper face aux changements de DOM.
- `rate-limiting.md` : Gestion fine des limites de débit de l'API Gmail et Z.ai.

### 2.2 Compétences (`skills/`)
- **job-scraper** : Extraction des données via Playwright.
- **batch-filter** : Filtrage de masse avec l'API Z.ai (GLM-5.2).
- **gmail-sender** : Envoi de mails OAuth2.
- **state-manager** : Manipulation de la base de données locale.
- **rate-limiter** : Temporisation et gestion des quotas API.
- **cline-orchestrator** : Pont entre la DB et la rédaction de prompts avancés.

### 2.3 Workflows (`workflows/`)
- **daily-harvest.md** : Récolte nocturne.
- **smart-outreach.md** : Stratégie de contact hyper-personnalisée.
- **crash-recovery.md** : Reprise sur erreur.
- **database-sync.md** : Maintenance de l'état local.

## 3. Stack Technologique Cible
- **Langage** : TypeScript (Strict Mode = true).
- **Runtime** : Node.js (v20+).
- **Scraping** : Playwright (Headless/Headed configurable).
- **Validation IA** : API Z.ai (Modèle GLM-5.2 - Batch mode for cost efficiency).
- **Email** : API Google (Gmail, protocole OAuth2).
- **Orchestration IA locale** : SDK Cline.
- **Persistance** : SQLite local (`.sqlite` gitignored).

## 4. Objectifs de Performance (Apprenti B3)
- **Taux de faux positifs post-filtre Z.ai** : < 5% (exclusion des offres Master/Bac+5, organismes de formation).
- **Temps de génération par candidature** : < 30 secondes.
- **Score d'Ouverture d'email ciblé** : > 60% grâce à la personnalisation extrême Cline.
