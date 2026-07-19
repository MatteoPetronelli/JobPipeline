# Résilience du Scraper & Gestion des Sélecteurs (scraper-resilience.md)

## 1. Stratégie de Résolution en Cascade
En cas d'échec d'un sélecteur CSS configuré dans selectors-schema.json, le scraper doit appliquer l'ordre de repli suivant :
1. Sélecteurs alternatifs basés sur les attributs sémantiques HTML5 (role, aria-label, placeholder)
2. Recherche textuelle insensible à la casse (ex: bouton contenant "Postuler")
3. Extraction brute du DOM de la zone parente pour identification heuristique
4. Appel API Z.ai (GLM-5.2) avec le fragment HTML pour extraire la donnée manquante

## 2. Maintenance Autonome des Sélecteurs
Si un sélecteur principal échoue mais qu'un sélecteur de repli fonctionne :
1. Notifier l'échec dans les logs système avec le tag [SELECTOR_DEPRECATED]
2. Proposer la mise à jour de selectors-schema.json
3. Lever une alerte non-bloquante pour la validation des nouveaux sélecteurs

## 3. Gestion des Erreurs Bloquantes
Si l'extraction du titre de l'offre ou du nom de l'entreprise échoue après application de toutes les étapes de repli :
1. Marquer le job avec le statut ERROR_SCRAPING
2. Enregistrer la trace de l'erreur et effectuer une capture d'écran dans .logs/screenshots/
3. Passer à l'offre suivante sans interrompre le workflow global
