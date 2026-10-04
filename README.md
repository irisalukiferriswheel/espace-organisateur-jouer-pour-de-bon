# Espace organisateur — Jouer Pour de Bon

Frontend public de l’espace organisateur, destiné à être intégré dans Wix.

La logique d’autorisation et les opérations sensibles doivent rester côté API/backend. Aucun secret ne doit être stocké dans ce dépôt public.

## Contrat de proposition de cause

Le formulaire transmet les données de cause dans `payload.causeSubmission` :

- `causeName`
- `causeDescription`, accompagné de `causeDescriptionLocale`
- `causeDescriptions.fr` et/ou `causeDescriptions.en`
- `causeGoalAmount` et `causeGoalCurrency`
- `causeApprovalStatus: "pending"`

L’interface ne confirme jamais une sauvegarde complète tant que la réponse
`JPDB_ORGANIZER_DRAFT_SAVED` ne contient pas
`payload.causeSubmission.status` avec la valeur `pending` ou `approved`.
Une réponse qui confirme seulement l’événement conserve le formulaire à l’écran et
affiche une erreur explicite.

Le backend doit encore fournir la résolution d’une cause canonique (y compris la
détection des doublons), la persistance des descriptions localisées, de l’objectif
et de la devise, puis retourner cet accusé de réception. Jusqu’à ce contrat, aucune
sélection de cause existante n’est simulée dans l’interface.

## Validation financière

Le prix d’inscription doit être partageable exactement au cent près : 50 % pour la
cause et 50 % pour l’allocation des joueurs gagnants. Pour éviter un calcul de taux
de change non défini, la devise de l’événement doit actuellement être la même que
celle de l’objectif de la cause.

## Développement

```sh
npm test
npm run check
```
