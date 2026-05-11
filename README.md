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
- `DB_URL` : L'URL de la base de données
- `DB_USER` : Le nom d'utilisateur de la BDD
- `DB_PASSWORD` : Le mot de passe de la BDD
- `DB_NAME` : Le nom de la BDD


Exemple de `.env`:
```env
SERVER_IP=127.0.0.1
SERVER_PORT=8080
SITE_FOLDER=./site
DB_URL=localhost
DB_USER=usr
DB_PASSWORD=pswd
DB_NAME=my_db
```

Après cela, le serveur est installé.

### Lancement
---
```bash
node index.js
```