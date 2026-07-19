# Tolérance aux Pannes & Retry (error-handling.md)

## 1. Philosophie Globale
Une erreur réseau ou un blocage de scraping temporaire **NE DOIT PAS** faire crasher le pipeline global. JobPipeline doit fonctionner selon le principe du "Fail-Safe".

## 2. Exponential Backoff Pattern
Tout appel réseau (API Z.ai, API Gmail, Navigation Playwright) doit être entouré d'une fonction wrapper implémentant des retries avec délai exponentiel :
- Essai 1 : Échec -> Attente 2s
- Essai 2 : Échec -> Attente 4s
- Essai 3 : Échec -> Attente 8s
- Après X essais, l'erreur est logguée et la ressource est marquée comme `FAILED_TEMPORARY` ou `FAILED_PERMANENT` dans le State Manager.

## 3. Circuit Breaker
Si l'API Gmail renvoie 3 erreurs `429 Too Many Requests` consécutives, un Circuit Breaker doit s'activer :
- Tous les envois suivants sont immédiatement mis en file d'attente sans interroger l'API.
- Une alerte est déclenchée localement.
- Le circuit se referme (tente un nouvel appel) après une période de refroidissement (Cooldown) de 30 minutes.

## 4. Spécificités Playwright
- Les Timeout Errors de Playwright doivent déclencher des screenshots locaux (dans `.logs/screenshots/`) pour analyse hors-ligne, sans stopper l'extraction des autres annonces de la liste.
