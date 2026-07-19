---
name: job-scraper
description: Scrape les plateformes d'emploi via Playwright de manière robuste, en évitant les honeypots et les blocages réseau.
---

# Skill: Job Scraper

## Commandes
`/scrape [source]`

## Directives d'Exécution
1. **Contexte Playwright** : Toujours utiliser un nouveau contexte de navigateur avec un `userAgent` réaliste injecté aléatoirement.
2. **Navigation** : Utiliser `waitUntil: 'domcontentloaded'` au lieu de `networkidle` pour accélérer le processus et éviter les timeouts sur les iframes publicitaires.
3. **Extraction** : Mapper strictement le DOM vers le fichier `selectors-schema.json`.
4. **Gestion d'Erreurs** :
   - Si Cloudflare/Datadome captcha est détecté (code 403 ou page bloquée), fermer le contexte immédiatement, logguer `FAILED_TEMPORARY`, et passer à l'URL suivante.
5. **Nettoyage Déterministe** : Nettoyer le HTML extrait en supprimant les balises `<style>`, `<script>`, `<img>` pour ne garder que le texte brut et optimiser le coût des tokens Z.ai.
