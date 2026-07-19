# Anti-Hallucination (anti-hallucination.md)

## 1. Dépendances et Bibliothèques NPM
L'agent **NE DOIT SOUS AUCUN PRÉTEXTE** inventer, supposer ou installer des packages NPM qui n'existent pas ou ne sont pas standards.
- Seuls les packages formellement vérifiés et maintenus (Playwright, Axios/Fetch natif, googleapis, sqlite3, zod) sont autorisés.
- Ne jamais deviner le nom d'un wrapper non-officiel (ex: ne pas utiliser `easy-gmail-api` mais utiliser le SDK officiel `googleapis`).

## 2. API tierces et Endpoints
- **Z.ai API (GLM-5.2)** : Toujours vérifier la structure exacte du payload via la documentation officielle. Ne pas deviner les champs d'un modèle. Toujours prioriser les appels "Batch" documentés si disponibles pour réduire les coûts.
- **Gmail OAuth2** : L'implémentation doit strictement suivre le flow OAuth2 de Google. Aucun contournement par "mots de passe d'application" (App Passwords) n'est autorisé pour des raisons de sécurité moderne.

## 3. Méthodes Intégrées (Node.js & TS)
- Avant de créer une fonction utilitaire (ex: manipulation de chemin), utiliser systématiquement les modules natifs (`path`, `fs/promises`).
- L'agent doit se référer au type `tsconfig.json` ciblé avant d'utiliser des fonctionnalités JS très récentes.

## 4. Comportement en cas de Doute
Si une documentation (API) ou un type manque pour accomplir une tâche de façon déterministe, **l'agent a l'ordre formel d'interrompre l'exécution et de requérir une clarification utilisateur** plutôt que de deviner.
