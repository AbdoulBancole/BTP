Oui. Je te conseille d’ajouter une section Installation / Prise en main avant « Lancer le projet », notamment puisque tu viens de passer par Git et que le projet peut être récupéré par quelqu’un d’autre.

# CraneFlow
Prototype frontend simple pour la gestion des activités et des conflits d’utilisation des grues.
## Prérequis
Avant de lancer le projet, vérifier que les outils suivants sont installés :
- Python 3
- Git
Pour vérifier Python :
```bash
python3 --version

Installation

Cloner le projet :

git clone https://github.com/AbdoulBancole/BTP.git

Entrer dans le dossier :

cd BTP

Le projet étant un prototype frontend simple, aucune installation de dépendances n’est nécessaire.

Lancer le projet

Depuis le dossier du projet :

python3 -m http.server 8000

Puis ouvrir dans le navigateur :

http://localhost:8000

Pour arrêter le serveur :

Ctrl + C

Structure du projet

BTP/
├── index.html
├── style.css
├── script.js
├── conflicts.js
├── data.js
├── plan-lider/
└── README.md

* index.html : structure de l’interface.
* style.css : styles et mise en forme.
* script.js : logique principale de l’application.
* conflicts.js : détection et gestion des conflits entre activités.
* data.js : données utilisées par le prototype.
* plan-lider/ : éléments liés au planning.

Objectif

Cette interface permet de :

* saisir une activité (date, zone, opération, grue, horaires, livraison, responsable),
* visualiser les conflits de créneaux entre activités sur une même grue,
* afficher un planning horaire clair pour chaque grue,
* présenter la solution numérique autour de Microsoft Power Apps, SharePoint et Power Automate.

Mise à jour du projet

Après avoir récupéré le projet depuis GitHub, les modifications peuvent être envoyées avec :

git add .
git commit -m "Description des modifications"
git push
