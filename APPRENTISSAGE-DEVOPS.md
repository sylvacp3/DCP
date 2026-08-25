# Apprentissage DevOps

Projet pratique : application DCP.

## Notions étudiées

* Dépôt Git
* Commit
* Branche
* Historique



\## Dépôt distant



\- `origin` désigne le dépôt distant principal.

\- `push` envoie les commits vers le dépôt distant.

\- `pull` récupère les nouveaux commits.

\- `origin/main` représente la branche principale distante.

## Intégration continue avec Jenkins

Le projet DCP utilise un Jenkinsfile versionné dans Git.

- Récupération automatique du code depuis GitHub
- Construction des images backend et frontend
- Publication des images dans Docker Hub
- Déclenchement par scrutation SCM

