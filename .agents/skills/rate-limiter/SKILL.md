---
name: rate-limiter
description: Protège l'infrastructure contre les bannissements IP et les erreurs HTTP 429.
---

# Skill: Rate Limiter

## Commandes
`/throttle [service]`

## Directives d'Exécution
1. **Playwright Scraper** :
   - Délai aléatoire entre 2.5s et 6s entre chaque visite de page.
   - Pause forcée (Cooldown) de 3 minutes toutes les 50 annonces visitées.
2. **Z.ai API (GLM-5.2)** :
   - Strictement respecter le quota TPM (Tokens Per Minute) et RPM (Requests Per Minute) fourni par le dashboard Z.ai.
   - En cas d'erreur 429, activer le Retry Pattern avec un délai exponentiel (base de 10 secondes).
3. **Gmail API** :
   - Maximum 50 emails par jour pour préserver la réputation de l'adresse IP et du domaine.
   - Délai fixe de 45 secondes minimum entre chaque appel `POST /send`.
