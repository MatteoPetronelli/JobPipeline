---
description: Traitement complet d'une offre d'emploi, du filtrage par lot à l'envoi de la candidature personnalisée
---

# Workflow : Smart Outreach

## Phase 1 : Traitement par Lots
1. Sélectionner en base SQLite jusqu'à 20 offres au statut NEW.
2. Mettre à jour leur statut à FILTERING.
3. Transmettre le lot à l'API Z.ai via batch-filter.
4. Assigner le statut APPROVED_BY_ZAI ou REJECTED_BY_ZAI selon le résultat de l'API.

## Phase 2 : Rédaction
1. Sélectionner les offres APPROVED_BY_ZAI.
2. Invoquer cline-orchestrator pour rédiger l'email d'accroche personnalisé.
3. Enregistrer le texte généré dans la colonne generatedPrompt et passer le statut à READY_FOR_HUMAN.

## Phase 3 : Validation Humaine
1. Présenter les brouillons READY_FOR_HUMAN à l'utilisateur dans l'interface de validation.
2. Si validé, conserver le statut ou passer à READY_FOR_SEND. Si rejeté, passer au statut HUMAN_ABORTED.

## Phase 4 : Envoi Final
1. Récupérer les offres validées.
2. Invoquer gmail-sender pour construire le message MIME et y joindre le CV au format PDF.
3. Envoyer l'email via l'API Gmail sous réserve du respect des quotas du rate-limiter.
4. Mettre à jour le statut du job à SENT en cas de succès.
