# 🚀 Déploiement GRATUIT de LUMINA (Render + db4free.net)

Ce guide permet d'héberger **gratuitement** le backend Node.js ET le frontend de LUMINA, avec une base MySQL gratuite.

| Service | Rôle | Coût |
|---|---|---|
| [Render](https://render.com) | Web Service Node.js (API + frontend statique, HTTPS inclus) | Gratuit (tier free) |
| [db4free.net](https://www.db4free.net) | Base de données MySQL 8.0 | Gratuit (pas de carte bancaire) |

> Le code a déjà été préparé : la configuration (BD, CORS, JWT) se fait **uniquement par variables d'environnement**, et le frontend appelle l'API via `window.location.origin` (aucune modification à refaire).

---

## 1️⃣ Créer la base MySQL gratuite (db4free.net)

1. Rendez-vous sur **https://www.db4free.net/signup.php**
2. Remplissez le formulaire :
   - **User name** : par exemple `lumina_user` (cela deviendra votre nom de base ET votre utilisateur)
   - **Password / Repeat** : créez un mot de passe dédié (db4free stocke les mots de passe en clair → n'utilisez pas un mot de passe important)
   - **Email** : un email valide (pour la confirmation)
3. Validez puis **confirmez** l'inscription depuis l'email reçu.
4. Notez ces informations :

| Paramètre | Valeur (exemple) |
|---|---|
| Host | `db4free.net` |
| Port | `3306` |
| Base de données | base `= votre User name` |
| Utilisateur | `votre User name` |
| Mot de passe | `votre mot de passe` |

5. Ouvrez **phpMyAdmin** : https://www.db4free.net/phpMyAdmin/ et connectez-vous.
6. Menu **Importer** → sélectionnez `backend/database_deploy.sql` → **Importer**.
   > Ce script crée les tables, le catalogue (40 produits) et le compte admin **sans** toucher au compte de connexion.

---

### 🟢 Parcours Aiven (recommandé, fiable)

1. Inscrivez-vous : **https://console.aiven.io/signup** (email, ou GitHub/Google).
2. Dashboard → **Create a service** → choix **MySQL** → **Plan : Free** → nom `lumina-db` → **Create service**.
3. Attendez le statut **RUNNING** (~1 à 3 min).
4. Onglet **Connection information** (bouton **Connect**) → copiez **Host**, **Port**, **Database** (`defaultdb`), **User** (`avnadmin`) et le **Password**.
5. Aiven n'a pas de phpMyAdmin → importez le catalogue avec le client MySQL local (PowerShell, car `<` n'est pas supporté) :

   ```powershell
   Get-Content -Raw "C:\Users\PC\Desktop\Lumina\backend\database_deploy.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h VOTRE_HOST -P VOTRE_PORT -u avnadmin -pVOTRE_MDP --ssl-mode=REQUIRED defaultdb
   ```

6. Variables Render : `DB_HOST`=Host, `DB_PORT`=Port (≠3306), `DB_USER`=`avnadmin`, `DB_PASSWORD`=Password, `DB_NAME`=`defaultdb`, `DB_SSL`=`true`.

> ⚠️ Le plan gratuit Aiven s'éteint après une période d'inactivité (prévenu par email) ; les visites sur le site le réveillent automatiquement.

💡 **Autres hébergeurs MySQL gratuits** (choisissez-en un — db4free et ces trois-là fonctionnent avec le même code) :

| Hébergeur | Inscription | Particularités | Variables Render |
|---|---|---|---|
| **freesqldatabase.com** | https://www.freesqldatabase.com/ | MySQL 8.0 réel, 100 Mo, phpMyAdmin inclus, très simple | `DB_SSL=false`, port `3306` |
| **Aiven MySQL** | https://console.aiven.io/signup | MySQL managé pro, sans limite de temps, TLS inclus | `DB_SSL=true`, port indiqué par Aiven |
| **TiDB Cloud** | https://tidbcloud.com/free-trial | Compatible MySQL, 5 Go serverless, très fiable | `DB_SSL=true`, port `4000` |

Dans tous les cas, il suffit de remplir dans Render les variables `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` et `DB_SSL` avec les valeurs fournies par **l'hébergeur choisi**, puis d'importer `backend/database_deploy.sql` (phpMyAdmin ou SQL tab).

---

## 2️⃣ Mettre le projet sur GitHub

Render déploie depuis GitHub (ou GitLab). Le dépôt Git est déjà initialisé :

```bash
cd C:\Users\PC\Desktop\Lumina

# Premier commit
git add .
git commit -m "Initial commit Lumina"

# Créer un dépôt sur github.com (sans README, sans .gitignore) puis :
git remote add origin https://github.com/VOTRE_COMPTE/lumina.git
git branch -M main
git push -u origin main
```

---

## 3️⃣ Créer le Web Service sur Render

1. Créez un compte sur **https://render.com** (bouton *Sign up* → avec GitHub, le plus simple).
2. Dans le dashboard : **New** → **Web Service**.
3. **Connectez** votre compte GitHub et sélectionnez le dépôt `lumina`.
4. Render détecte automatiquement **Node.js** et lit `package.json` :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
5. **Instance Type** : choisissez le plan **Free** (il met quelques secondes de mise en service).
6. Dans la section **Environment** (ou *Advanced > Environment Variables*), ajoutez :

| Variable | Valeur |
|---|---|
| `DB_HOST` | `db4free.net` |
| `DB_USER` | votre User name db4free |
| `DB_PASSWORD` | votre mot de passe db4free |
| `DB_NAME` | votre base (= User name) |
| `DB_PORT` | `3306` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | une chaîne longue et aléatoire (ex. `aZ9!mKx2...`) |

7. Cliquez sur **Create Web Service**.
8. Attendez le déploiement (1 à 3 min). Une URL **`https://votre-service.onrender.com`** vous est attribuée.

---

## 4️⃣ Vérifier

Une fois le déploiement terminé :

- 🌐 **Accueil** : `https://votre-service.onrender.com/`
- 🕯️ **Catalogue Large** : `https://votre-service.onrender.com/large`
- 🛒 **Panier + commande** : ajoutez un produit et validez la commande
- 🔐 **Admin** : `https://votre-service.onrender.com/admin` → `admin` / `admin123`
- ❤️ **État API** : `https://votre-service.onrender.com/api/health` → `{"status":"OK",...}`

---

## ⚠️ À savoir (tier gratuit)

- **Mise en veille** : après ~15 min sans visiteur, le service se met en pause. La première visite peut prendre 30 à 60 s (le temps de "réveiller" le serveur).
- **Heures** : 750 heures d'activité / mois (largement suffisant pour un petit site).
- **db4free.net** : la base est **supprimée après 30 jours d'inactivité** (elle reste active tant que votre site est consulté). Ne l'utilisez pas pour des données critiques.
- **Sécurité** : votre site étant public, remplacez le mot de passe admin et choisissez un `JWT_SECRET` fort.

---

## 🔁 Relancer une mise à jour

À chaque modification, poussez sur GitHub :

```bash
git add .
git commit -m "Nouvelle amélioration"
git push
```

Render redéploie automatiquement.