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

Après cela, il faut créer un fichier `.env` qui doit contenir les informations suivantes :
- `SERVER_IP` : IP sur lequel le serveur Web tournera
- `SERVER_PORT` : Port sur lequel le serveur Web écoutera

Exemple de `.env`:
```env
SERVER_IP=127.0.0.1
SERVER_PORT=8080
```

Après cela, le serveur est installé.

### Lancement
---
```bash
node index.js
```