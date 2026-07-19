---
name: gmail-sender
description: Ordonnance l'envoi d'e-mails hyper-personnalisés via l'API Gmail avec protocole OAuth2.
---

# Skill: Gmail Sender

## Commandes
`/send-outreach [jobId]`

## Directives d'Exécution
1. **Authentification** : 
   - Utiliser `googleapis` (google.auth.OAuth2).
   - Charger `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` depuis `.env`.
   - Rafraîchir le token dynamiquement à chaque session.
2. **Construction de l'E-mail (MIME)** :
   - Construire le message au format `multipart/mixed`.
   - Inclure le corps en HTML généré par `cline-orchestrator`.
   - **Important** : NE SURTOUT PAS générer ou concaténer de signature HTML manuelle. Configurer l'appel à l'API Gmail pour s'appuyer strictement sur la signature native existante du compte nommée "Alternant web" (en n'écrasant ni n'omettant les paramètres d'envoi par défaut liés au profil de l'utilisateur).
   - Ajouter le `CV_Matteo_2026.pdf` (depuis `./assets/`) en pièce jointe (`application/pdf`) codée en Base64.
3. **Sécurité d'Envoi** :
   - Vérifier l'état dans la DB locale : L'offre doit être `READY_FOR_HUMAN` et valider l'input de l'utilisateur.
   - APRÈS succès de l'envoi (code 200), marquer l'offre comme `SENT` immédiatement pour prévenir les envois multiples en cas de retry.
