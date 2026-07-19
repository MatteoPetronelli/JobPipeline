---
description: Maintenance, nettoyage des offres refusées et défragmentation de la base SQLite locale
---

# Workflow : Database Sync

## Phase 1 : Purge des Offres Refusées
1. Supprimer de la base de données toutes les offres au statut REJECTED_BY_ZAI ou REJECTED_BY_CODE datant de plus de 15 jours.

## Phase 2 : Archivage des Offres sans Réponse
1. Mettre à jour le statut des offres en SENT depuis plus de 21 jours sans réponse vers le statut ARCHIVED_NO_REPLY.

## Phase 3 : Optimisation
1. Exécuter la commande VACUUM sur la base SQLite pour défragmenter l'espace disque.

## Phase 4 : Sauvegarde
1. Créer une copie de sauvegarde dans le répertoire .backups sous le format db-YYYY-MM-DD.sqlite.bak.
