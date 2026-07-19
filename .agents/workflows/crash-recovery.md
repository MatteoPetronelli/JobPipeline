---
description: Reprise sur erreur et restauration des états de jobs suite à un crash du pipeline
---

# Workflow : Crash Recovery

## Phase 1 : Audit de l'État Intermédiaire
1. Rechercher tous les jobs avec des états transitoires : FILTERING ou PROMPT_GENERATED.

## Phase 2 : Rollback des États Fantômes
1. Si une offre est restée en statut FILTERING depuis plus de 2 heures, modifier son statut à NEW pour qu'elle soit re-sélectionnée lors du prochain batch.

## Phase 3 : Reprise de l'Envoi
1. Si l'application a crashé pendant la Phase 4 de smart-outreach, requêter l'API Gmail pour s'assurer que l'offre n'a pas déjà été envoyée.
2. Si le mail est absent de la boîte d'envoi, relancer l'envoi et passer le statut du job à SENT.

## Phase 4 : Notification de Récupération
1. Écrire dans les logs du terminal le nombre de jobs restaurés.
