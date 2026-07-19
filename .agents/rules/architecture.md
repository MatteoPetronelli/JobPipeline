# Directives d'Architecture (architecture.md)

## 1. Principes de Conception Fullstack
- **Modularité** : Chaque composant de `JobPipeline` doit être strictement découplé. Le scraper n'interagit jamais directement avec le sender Gmail. Ils communiquent via le *State Manager* (Base de données).
- **Isolation des APIs** : Tous les appels vers des services tiers (Playwright, Z.ai, Gmail) doivent être encapsulés dans des classes de services (`Services/`) qui implémentent des interfaces dédiées.

## 2. Typage Strict TypeScript
- `strict: true` obligatoire dans `tsconfig.json`.
- **Aucun `any` autorisé.** L'utilisation de `unknown` est tolérée avec des Type Guards ou Zod schemas pour la validation des données d'API externes.
- Les modèles de données (Job, Email, APIResponse) doivent être définis dans un dossier central `/types`.

## 3. Asynchronisme Avancé
- Éviter absolument le "Callback Hell" ou les `.then()` chaînés inutilement. Utiliser `async/await` systématiquement.
- Préférer `Promise.allSettled` à `Promise.all` pour les lots (Batching), afin qu'une erreur sur un job ne fasse pas crasher l'ensemble du traitement.
- Toujours déléguer la logique bloquante ou longue (Scraping) à des workers ou au moins garantir l'utilisation non-bloquante de l'Event Loop de Node.js.

## 4. Architecture Dossiers Cible (Application)
```
/src
  /config       (Variables d'environnement parsées et validées par Zod)
  /db           (Connexion SQLite, migrations)
  /services     (Scraper, ZaiAPI, GmailAPI)
  /models       (Types, Zod schemas)
  /workflows    (Orchestration de bout en bout)
  /utils        (Helpers génériques)
```
