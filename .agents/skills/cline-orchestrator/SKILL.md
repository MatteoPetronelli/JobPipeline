---
name: cline-orchestrator
description: Interagit avec le SDK de Cline pour transformer une annonce validée en un email d'accroche hyper-personnalisé et humain.
---

# Skill: Cline Orchestrator

## Commandes
`/generate-prompt [jobId]`

## Directives d'Exécution
1. **Contexte d'Entrée** : 
   - Recevoir les données brutes du Job (`rawDescription`, `companyName`, `jobTitle`) via le State Manager.
   - Fournir à Cline le contexte de l'apprenti B3 Fullstack (Matteo).
2. **Prompt Engineering pour Cline** :
   - Style : Professionnel, direct, percutant, pas de langue de bois.
   - Format : E-mail brut avec objet accrocheur.
   - Contraintes : Moins de 150 mots. Doit mentionner une stack technique de l'annonce et faire le pont avec les compétences TypeScript de Matteo.
   - Aucun placeholder comme `[Votre Nom]`. Insérer la donnée réelle.
3. **Stockage** :
   - Enregistrer la réponse dans la colonne `generatedPrompt` de la base de données locale et passer l'état à `READY_FOR_HUMAN`.
