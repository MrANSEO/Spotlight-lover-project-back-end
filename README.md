# 🎬 Spotlight Lover - Plateforme de Concours Vidéo

## 📋 Vue d'ensemble

Spotlight Lover est une plateforme de concours en ligne pour valoriser les talents africains via des vidéos courtes (danse, chant, sketch, performances artistiques). Le public vote de manière illimitée à **100 FCFA par vote**.

## 🎯 Caractéristiques principales

- ✅ **Concours vidéo uniquement** (pas de photos)
- ✅ **Vote illimité** (pas de limite par utilisateur)
- ✅ **1 vote = 100 FCFA**
- ✅ **Classement temps réel** (mise à jour toutes les 10 secondes)
- ✅ **Validation manuelle** des candidatures par admin
- ✅ **Paiements multiples** : MTN Mobile Money, Orange Money, Stripe, Carte bancaire

## 🏗️ Architecture du projet

```
spotlight-lover/
├── backend/          # API NestJS + PostgreSQL + Prisma
├── frontend/         # Next.js 14 + TailwindCSS
└── docs/            # Documentation technique
```

## 🚀 Stack technologique

### Backend
- **Framework** : NestJS (TypeScript)
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **Authentification** : JWT + 2FA (optionnel)
- **WebSocket** : Socket.IO (classement temps réel)
- **Stockage vidéo** : Cloudinary
- **Paiements** : MTN MoMo API, Orange Money API, Stripe

### Frontend
- **Framework** : Next.js 14 (App Router)
- **Styling** : TailwindCSS + ShadcN UI
- **État** : React Query
- **Animations** : Framer Motion

### Infrastructure
- **Hébergement** : Railway / Render
- **CDN** : Cloudinary
- **Monitoring** : Sentry (optionnel)

## 📊 Statut du projet

- **Statut** : 🔨 En développement
- **Version** : 0.1.0
- **Dernière mise à jour** : 2025-01-06

## 🎨 Charte graphique

- **Noir** (#000000) : Fond principal
- **Or** (#D4AF37) : Accents, boutons
- **Rose** (#FF1493) : Liens, call-to-action
- **Police titres** : Poppins (Bold)
- **Police corps** : Inter (Regular)

## 📈 Fonctionnalités implémentées

### ✅ Phase 1 - Fondations (En cours)
- [x] Structure projet
- [ ] Backend NestJS + Prisma
- [ ] Module Auth (JWT + 2FA)
- [ ] Module Candidates
- [ ] Module Votes
- [ ] Intégration paiements

### ⏳ Phase 2 - Cœur métier
- [ ] Upload vidéo Cloudinary
- [ ] Classement temps réel
- [ ] Dashboard admin
- [ ] Analytics & exports

### ⏳ Phase 3 - Finalisation
- [ ] Frontend Next.js
- [ ] Tests E2E
- [ ] Déploiement production

## 🛠️ Installation locale

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurer .env avec vos clés API
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## 🌍 URLs

- **Backend API** : `http://localhost:4000`
- **Frontend** : `http://localhost:3000`
- **Admin Dashboard** : `http://localhost:3000/admin`

## 👥 Public cible

- **Âge** : 18-35 ans
- **Localisation** : Afrique francophone (Côte d'Ivoire, Sénégal, Cameroun, RDC, etc.)
- **Profil** : Actifs sur TikTok, Instagram Reels, YouTube Shorts
- **Passions** : Création vidéo, performance, divertissement

## 💰 Modèle économique

- **Vote** : 100 FCFA/vote (illimité)
- **Frais plateforme** : 3-5% par transaction
- **Prix candidats** : À définir par concours

## 📞 Support

Pour toute question, contactez l'équipe Spotlight Lover.

---

**Produit par** : Équipe Spotlight Lover  
**Licence** : Propriétaire  
**Tous montants exprimés en FCFA (XOF)**
