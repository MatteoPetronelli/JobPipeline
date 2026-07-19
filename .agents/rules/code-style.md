# Code Style & Propreté (code-style.md)

## RÈGLE ABSOLUE ET NON NÉGOCIABLE : ZERO COMMENTS POLICY
Tous les commentaires explicatifs, les lignes de code commentées obsolètes ou les annotations de tâches doivent être systématiquement supprimés du code source. Le code doit être auto-explicatif par sa structure et le nommage de ses variables, fonctions et classes.

### Pratique Interdite (Mauvais nommage et commentaires)
```typescript
const u = page.url();
```

### Pratique Obligatoire (Auto-documentation par typage et nommage clair)
```typescript
const currentPageUrl = page.url();
if (!currentPageUrl) {
  throw new MissingPageUrlError();
}
```

## Conventions de Nommage
- Classes, Types, Interfaces : PascalCase (ex: JobScraper, EmailTemplate)
- Fonctions, Variables, Instances : camelCase (ex: scrapeJobs, filteredList)
- Constantes Globales (non mutables) : UPPER_SNAKE_CASE (ex: MAX_RETRIES, BATCH_SIZE)
- Fichiers : kebab-case.ts (ex: job-scraper.service.ts)

## Formatage
- Indentation : 2 espaces
- Points-virgules obligatoires à la fin des instructions
- Guillemets simples pour les chaînes de caractères
- Utilisation de Prettier
