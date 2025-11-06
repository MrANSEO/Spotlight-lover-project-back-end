# 🎬 Spotlight Lover Backend

API REST pour la plateforme de concours vidéo Spotlight Lover.

## 🚀 Technologies

- **NestJS** - Framework Node.js TypeScript
- **PostgreSQL** - Base de données relationnelle
- **Prisma ORM** - Gestion base de données
- **JWT** - Authentification
- **Socket.IO** - WebSocket temps réel
- **Cloudinary** - Stockage vidéos
- **Stripe** - Paiements cartes bancaires
- **MTN MoMo API** - Mobile Money MTN
- **Orange Money API** - Mobile Money Orange

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# Générer le client Prisma
npx prisma generate

# Créer la base de données et lancer les migrations
npx prisma migrate dev

# Peupler la base (optionnel)
npm run prisma:seed
```

## 🗄️ Base de données

### Créer la base PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE spotlight_lover;

# Quitter
\q
```

### Gérer les migrations

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name description_migration

# Appliquer les migrations en production
npm run prisma:migrate:prod

# Réinitialiser la base (dev only)
npm run prisma:reset

# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio
```

## 🏃 Lancement

### Mode Développement
```bash
npm run start:dev
```

### Mode Production
```bash
npm run build
npm run start:prod
```

## 🔌 API Endpoints

### Health Check
- `GET /api/health` - État de l'API
- `GET /api/health/ping` - Test de connectivité

### Auth (À implémenter)
- `POST /api/auth/login` - Connexion admin
- `POST /api/auth/refresh` - Renouveler token
- `GET /api/auth/me` - Profil admin

### Candidates (À implémenter)
- `POST /api/candidates` - Inscription candidat
- `GET /api/candidates` - Liste candidats approuvés
- `GET /api/candidates/:id` - Détails candidat

### Votes (À implémenter)
- `POST /api/votes/initiate` - Créer intent de vote
- `GET /api/votes/:id/status` - Statut vote

### Payments
- `GET /api/payments/providers` - Liste providers disponibles
- `POST /api/payments/init` - Initialiser paiement (test)
- `GET /api/payments/status/:provider/:reference` - Statut transaction

### Webhooks (À implémenter)
- `POST /api/webhooks/mtn` - Webhook MTN MoMo
- `POST /api/webhooks/orange` - Webhook Orange Money
- `POST /api/webhooks/stripe` - Webhook Stripe

## 🔐 Configuration Paiements

### MTN Mobile Money

1. Créer un compte développeur : https://momodeveloper.mtn.com/
2. Créer une souscription "Collection"
3. Récupérer : API Key, API Secret, Subscription Key
4. Configurer `.env` avec les clés

### Orange Money

1. Créer un compte développeur : https://developer.orange.com/
2. Créer une application Orange Money
3. Récupérer : Client ID, Client Secret, Merchant Key
4. Configurer `.env` avec les clés

### Stripe

1. Créer un compte : https://stripe.com/
2. Activer le mode Test
3. Récupérer : Secret Key, Publishable Key
4. Configurer les webhooks
5. Récupérer : Webhook Secret

## 📊 Modèles de données principaux

### Admin
- Authentification administrateurs
- Rôles : SUPER_ADMIN, MODERATOR
- 2FA optionnel

### Candidate
- Informations candidat
- Vidéo (Cloudinary)
- Statuts : PENDING, APPROVED, REJECTED, SUSPENDED
- Statistiques (votes, revenus, vues)

### Vote
- Lien vers candidat
- Informations votant
- Paiement (méthode, statut, provider)
- Anti-fraude (IP, fingerprint)

### Transaction
- Audit trail des paiements
- Réponses API providers
- Métadonnées complètes

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## 📈 Statut Développement

### ✅ Phase 1 - Fondations (Complété)
- [x] Structure projet NestJS
- [x] Configuration Prisma
- [x] Modèles de données
- [x] Module Payments (MTN, Orange, Stripe)
- [x] Module Health

### ⏳ Phase 2 - En cours
- [ ] Module Auth (JWT + 2FA)
- [ ] Module Candidates (CRUD + validation)
- [ ] Module Votes (logique métier)
- [ ] Module Upload (Cloudinary)

### ⏳ Phase 3 - À venir
- [ ] Module Leaderboard (WebSocket)
- [ ] Module Analytics (stats + exports)
- [ ] Webhooks paiements
- [ ] Tests E2E

## 🚀 Déploiement

### Railway

```bash
# Installer Railway CLI
npm install -g railway

# Login
railway login

# Créer projet
railway init

# Déployer
railway up
```

### Variables d'environnement Production

Ne pas oublier de configurer :
- `DATABASE_URL` (PostgreSQL)
- Toutes les clés API
- `NODE_ENV=production`
- `JWT_SECRET` (générer une clé sécurisée)

## 📞 Support

Pour toute question, contactez l'équipe Spotlight Lover.

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-06
