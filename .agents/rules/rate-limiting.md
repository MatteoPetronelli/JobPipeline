# Gestion des Quotas & Limites de Débit (rate-limiting.md)

## 1. API Gmail (Outreach)
- Quota Quotidien : Maximum 50 emails par période glissante de 24 heures.
- Intervalle Minimum : Délai fixe de 45 secondes entre chaque envoi d'email.
- Circuit Breaker : Activation immédiate en cas de retour HTTP 429. Suspension de tous les envois restants pour une durée de 30 minutes.

## 2. API Z.ai (GLM-5.2)
- Quota de requêtes par minute (RPM) et tokens par minute (TPM) selon les spécifications courantes de la clé API.
- Gestion du trafic : Regroupement systématique en lots de 20 offres maximum.
- Politique de repli : Exponential Backoff avec un délai initial de 10 secondes en cas de code HTTP 429.

## 3. Scraper Playwright
- Délai Aléatoire : Intervalle compris entre 2.5 et 6 secondes entre le chargement de deux annonces.
- Période de Refroidissement : Cooldown forcé de 3 minutes toutes les 50 pages visitées.
- Mode de Chargement : Utilisation de domcontentloaded pour limiter les requêtes superflues vers les serveurs publicitaires.
