# CraneFlow

Prototype frontend simple pour la gestion des activités et des conflits d’utilisation des grues.

## Lancer le projet

Depuis le dossier du projet :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000
```

## Objectif

Cette interface permet de :
- saisir une activité (date, zone, opération, grue, horaires, livraison, responsable),
- visualiser les conflits de créneaux entre activités sur une même grue,
- afficher un planning horaire clair pour chaque grue,
- présenter la solution numérique autour de Microsoft Power Apps, SharePoint et Power Automate.
