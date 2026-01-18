# Back Clinique Val Lumineux
---

Ce répertoire contient le code du backend du projet d'étude [**Clinique Val Lumineux**](https://github.com/Outoine15/clinique_val_lumineux).

### Installation
---
```bash
git clone https://github.com/Outoine15/back_clinique_val_lumineux.git
cd back_clinique_val_lumineux
npm install
```

Après cela, il faut créer un fichier `.env` qui doit contenir au moins les informations suivantes :
- `SERVER_IP` : IP sur lequel le serveur Web tournera
- `SERVER_PORT` : Port sur lequel le serveur Web écoutera
- `SITE_FOLDER` : Dossier dans lequel se trouvera le site web


Exemple de `.env`:
```env
SERVER_IP=127.0.0.1
SERVER_PORT=8080
SITE_FOLDER=./site
```

Après cela, le serveur est installé.

Il est possible d'utiliser les WebHooks GitHub pour importer le front du site lorsqu'une release est faite.
L'adresse du WebHook est `http://votre.site/github`. Afin d'éviter l'usurpation lorsque vous recevez un WebHook, vous pouvez utiliser une [clé secrète sur le WebHook](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).

Pour utiliser cette clef secrète de votre côté aussi, il suffit d'ajouter la variable d'environnement `GITHUB_FRONT_SECRET` et d'y associé votre clé.

### Lancement
---
```bash
node index.js
```