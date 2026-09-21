# Espace organisateur — Jouer Pour de Bon

Frontend public de l’espace organisateur, destiné à être intégré dans Wix.

La logique d’autorisation et les opérations sensibles doivent rester côté API/backend. Aucun secret ne doit être stocké dans ce dépôt public.

## Brouillons existants

Chaque brouillon propose **Ouvrir le brouillon**. Le formulaire reprend ses détails
dans le fuseau horaire de l’événement. Enregistrer conserve son identifiant et sa
visibilité privée; Publier enregistre les changements avant de publier cet événement.
Un échec conserve le formulaire et, si la sauvegarde a réussi, l’identifiant du brouillon.

Messages ajoutés : `JPDB_ORGANIZER_UPDATE_DRAFT` et `JPDB_ORGANIZER_PUBLISH_EVENT`.
La réponse conserve `JPDB_ORGANIZER_DRAFT_SAVED` avec `requestId` et `payload.event`.
Une erreur de publication peut également retourner le brouillon dans `payload.event`.

Déployer d’abord l’API (PR 58 et sa migration), puis les méthodes et le pont Wix
correspondants, puis ce frontend. Le frontend seul ne suffit pas.

Test navigateur : `node tests/draft-workflow.cjs`, avec Playwright installé.
`PLAYWRIGHT_MODULE` peut pointer vers une installation existante; `BROWSER_CHANNEL`
sélectionne le navigateur (Edge par défaut). Le test intercepte toutes les requêtes
de l’application et ne modifie aucun événement réel.
