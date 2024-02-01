# Panier Bio Solidaire

Permet de récupérer les informations sur le panier de légume de la semaine et l'envoyer par email.
Il se connecte au site https://www.lespaniersbiosolidaires.fr/ et récupère le panier tous les vendredi à 18h30 et les lundi à 18h30, il récupère le croc'actu.

Si vous voulez utiliser ce script, il est nécessaire de forker le repos, et d'activer github action sur le repos.

## Github action

Pour l'utiliser, il faut définir trois variables d'environnement, dans les settings de github action.
- PANIERBIO_LOGIN : Email sur le site https://www.lespaniersbiosolidaires.fr/
- PANIERBIO_PASSWORD : Mot de passe sur le site https://www.lespaniersbiosolidaires.fr/
- MAILGUN_APIKEY : Clé d'api pour mailgun.


## Local

Installer les dépendances
```sh
npm install
```

Pour lancer en local, il faut exporter les trois variables d'environnements :
```sh
export PANIERBIO_LOGIN=""
export PANIERBIO_PASSWORD=""
export MAILGUN_APIKEY="demo"
export SEND_EMAIL="no"
```
Installer playwright:
```sh
npx playwright install
```

Puis lancer l'application
```shell
npm start
```


