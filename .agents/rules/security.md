# Sécurité & Confidentialité (security.md)

## 1. Gestion des Identifiants (Secrets Management)
L'application manipule des données hautement sensibles : clés API Z.ai, Refresh Tokens OAuth2 Google, Client ID/Secret.
- Aucun de ces éléments ne doit apparaître en dur (hardcodé) dans le code.
- Utilisation stricte d'un fichier `.env` (exclus via `.gitignore`).
- Les jetons OAuth2 renouvelés dynamiquement doivent être stockés de manière chiffrée ou dans un dossier local (ex: `.credentials/`) rigoureusement exclu de Git.

## 2. Protection des PII (Personally Identifiable Information)
Les offres d'emploi, emails des recruteurs, et noms des entreprises sont des données sensibles.
- Les logs ne doivent jamais afficher l'adresse e-mail complète d'un destinataire (utiliser un masque : `j***@entreprise.com`).
- En cas de crash de l'application, les traces d'erreur (Stack Traces) ne doivent pas inclure le corps de l'email ou les headers HTTP sensibles.

## 3. Sécurisation du Scraper Playwright
- Isoler le profil de navigation Playwright dans un dossier temporaire chiffré si des cookies de session sont sauvegardés pour contourner les protections Cloudflare.
- Effectuer des rotations d'User-Agents aléatoires et réalistes (fournies par un fichier statique) pour limiter la détection des faux bots.
