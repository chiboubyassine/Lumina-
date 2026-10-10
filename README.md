# LUMINA — Bougies Artisanales

Site e-commerce du projet **LUMINA by Boutaina** : boutique de bougies artisanales marocaines, avec catalogue (Small / Medium / Large), panier, commandes et panneau d'administration.

> 🚀 Pour héberger le site gratuitement, suivez le guide **[DEPLOYMENT.md](DEPLOYMENT.md)** (Render + MySQL gratuit).

## 🖥️ Stack technique

| Composant | Technologie |
|---|---|
| Backend | Node.js + Express |
| Base de données | MySQL 8.0 (MySQL Workbench) |
| Frontend | HTML / CSS / JavaScript (Bootstrap 5, Font Awesome) |
| Authentification | JWT + bcrypt |
| ORM | Aucun (requêtes SQL directes via `mysql2`) |

## 📁 Structure du projet

```
Lumina/
├── backend/
│   ├── app.js            # Serveur Express + routes API + init BDD
│   ├── database.sql      # Script complet d'installation de la base
│   └── package.json
├── frontend/
│   ├── home.html         # Page d'accueil
│   ├── small.html        # Catalogue Small
│   ├── medium.html       # Catalogue Medium
│   ├── Large.html        # Catalogue Large
│   ├── admin.html        # Panneau d'administration
│   └── (images et assets)
└── README.md
```

## ⚙️ Prérequis

- [Node.js](https://nodejs.org/) ≥ 16
- [MySQL](https://dev.mysql.com/downloads/) 8.0 (avec MySQL Workbench)
- npm

## 🚀 Installation

### 1. Base de données

Ouvrez **MySQL Workbench**, connectez-vous avec le compte **root**, puis exécutez le script :

```sql
SOURCE chemin/vers/backend/database.sql;
```

Ou depuis un terminal :

```bash
mysql -u root -p < backend/database.sql
```

Ce script crée automatiquement :

- la base `luminaca_db` ;
- l'utilisateur `luminaca_user` ;
- les tables `products`, `users`, `customers`, `orders`, `order_items`, `cart_items` ;
- le catalogue complet (40 produits Small / Medium / Large) ;
- le compte administrateur par défaut.

> Le serveur Node recrée seul toute la base s'il se connecte à une base vide (automatique si `database.sql` n'a pas été exécuté).

### 2. Backend

```bash
cd backend
npm install
npm start        # ou : npm run dev  (avec nodemon)
```

Le serveur démarre sur **`http://localhost:3000`** et initialise la base de données au premier lancement.

## 🔑 Connexion Base de données

| Paramètre | Valeur |
|---|---|
| Hôte | `localhost` |
| Port | `3306` |
| Base | `luminaca_db` |
| Utilisateur | `luminaca_user` |
| Mot de passe | `OX!HQN9lwW` |

Ces valeurs se configurent dans `backend/app.js` (bloc `dbConfig`).

## 👤 Compte administrateur

- Page : `http://localhost:3000/admin`
- Identifiant : `admin`
- Mot de passe : `admin123`

> Le mot de passe est stocké **haché en bcrypt** dans la table `users` (rôle `admin`).

## 🖥️ Pages du site

| URL | Page |
|---|---|
| `/` | Accueil |
| `/small` | Catalogue Small |
| `/medium` | Catalogue Medium |
| `/large` | Catalogue Large |
| `/admin` | Panneau d'administration |
| `/api/health` | État de l'API |

## 🔌 API — endpoints

### Produits
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/products` | Tous les produits (`?category=small\|medium\|large` pour filtrer) |

### Panier (par `session_id`)
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/cart?session_id=...` | Récupérer le panier |
| `POST` | `/api/cart` | Ajouter un produit `{ session_id, product_id, quantity }` |
| `PUT` | `/api/cart/:id` | Mettre à jour la quantité |
| `DELETE` | `/api/cart/:id?session_id=...` | Supprimer un article |
| `DELETE` | `/api/cart?session_id=...` | Vider le panier |

### Commandes & clients
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/orders` | Passer une commande |
| `GET` | `/api/orders` | Toutes les commandes |
| `GET` | `/api/orders/:id` | Détail d'une commande (avec articles) |
| `PUT` | `/api/orders/:id/status` | Mettre à jour le statut |
| `GET` | `/api/customers` | Tous les clients |

### Authentification
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Connexion admin `{ username, password }` → token JWT |

## 📊 Base de données — schéma

- **products** — catalogue des bougies (`name`, `price`, `image`, `category`)
- **users** — comptes administrateurs (`username`, `password` bcrypt, `role`)
- **customers** — informations clients
- **orders** — commandes (`order_number`, `total_amount`, `status`)
- **order_items** — articles de chaque commande
- **cart_items** — paniers temporaires par `session_id`

## 🧪 Scénario de test rapide

1. Lancez le backend (`npm start`).
2. Ouvrez `http://localhost:3000/large`, ajoutez une bougie au panier.
3. Validez le panier avec le formulaire de commande.
4. Connectez-vous sur `http://localhost:3000/admin` pour voir le tableau de bord et la commande.

## 📝 Notes

- Le front appelle l'API via `window.location.origin` : tout fonctionne en local **et** en production sans modification.
- Pour la mise en production, pensez à changer le secret JWT (`votre_secret_jwt` dans `backend/app.js`) et à utiliser une connexion MySQL sécurisée (HTTPS).

---

© 2025 Lumina. Tous droits réservés.