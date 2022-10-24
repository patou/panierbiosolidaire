# panierbiosolidaire
Permet de récupérer le panier de légume toute les semaines.
Il se connecte au site https://www.lespaniersbiosolidaires.fr/ et récupère le panier tous les vendredi à 18h30 et les lundi à 18h30, il récupère le croc'actu.

Si vous voulez utiliser ce script, il est nécessaire de forker le repos, et d'activer github action sur le repos.

## Github action

Pour l'utiliser, il faut définir trois variable d'environnement, dans les settings de github action.
- PANIERBIO_LOGIN : Email sur le site https://www.lespaniersbiosolidaires.fr/
- PANIERBIO_PASS : Mot de passe sur le site https://www.lespaniersbiosolidaires.fr/
- MAILGUN_APIKEY : Clé d'api pour mailgun.


## Local
Pour lancer en local, il faut exporter les trois varibles d'envrionnements :
```sh
export PANIERBIO_LOGIN=""
export PANIERBIO_PASS=""
export MAILGUN_APIKEY=""
```
Puis lancer l'application
```shell
npm start
```


