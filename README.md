# Espace organisateur — Jouer Pour de Bon

Frontend public de l’espace organisateur, destiné à être intégré dans Wix.

La logique d’autorisation et les opérations sensibles doivent rester côté API/backend. Aucun secret ne doit être stocké dans ce dépôt public.

## Emplois liés aux événements

Le formulaire peut soumettre zéro ou plusieurs emplois avec le même événement :

- `name`
- `description`
- `salaryAmount`
- `salaryCurrency`

Ces valeurs sont envoyées dans le tableau `jobs` du payload existant. Le backend
doit les conserver en attente d’approbation; un emploi soumis par un organisateur
ne doit jamais être publié automatiquement.
