# 🏗️ Architecture Technique - Spotlight Lover

## 📋 Vue d'ensemble

Spotlight Lover est une plateforme de concours vidéo avec système de votes payants. Architecture moderne découplée : backend API REST + frontend Next.js.

## 🎯 Diagramme d'Architecture Globale

```
┌──────────────────────────────────────────────────────────────────┐
│                        UTILISATEURS                               │
│  (Candidats, Votants, Spectateurs, Administrateurs)             │
└───────────────┬──────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Pages         │  │ Dashboard    │  │ Player       │          │
│  │ Publiques     │  │ Admin        │  │ Vidéo        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Technologies: React, TailwindCSS, Socket.IO Client              │
└───────────────┬───────────────────────────────────────────────────┘
                │ HTTP/REST + WebSocket
                ▼
┌───────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS)                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MODULES MÉTIER                                          │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │    │
│  │  │  Auth  │ │ Admin  │ │Candidat│ │ Votes  │          │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘          │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │    │
│  │  │Leaderbd│ │Analytic│ │ Upload │ │Payment │          │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Technologies: TypeScript, Prisma ORM, JWT, Socket.IO            │
└───┬────────┬────────┬────────┬────────┬────────────────────────┘
    │        │        │        │        │
    ▼        ▼        ▼        ▼        ▼
┌─────────┐ ┌─────┐ ┌──────┐ ┌─────┐ ┌──────────┐
│PostgreSQL│ │Redis│ │Cloudy│ │MTN  │ │ Orange   │
│(Données)│ │(Cache│ │(Vidéo│ │MoMo │ │ Money    │
│         │ │)    │ │)     │ │(API)│ │ (API)    │
└─────────┘ └─────┘ └──────┘ └─────┘ └──────────┘
                                      ┌──────────┐
                                      │  Stripe  │
                                      │  (API)   │
                                      └──────────┘
```

---

## 🗄️ Architecture Base de Données

### Schéma Relationnel Principal

```
┌─────────────┐
│    Admin    │
├─────────────┤
│ id (PK)     │
│ email       │
│ password    │
│ role        │
│ 2FA         │
└─────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│  AuditLog   │
├─────────────┤
│ id (PK)     │
│ adminId(FK) │
│ action      │
│ entityType  │
│ details     │
└─────────────┘


┌─────────────────┐         ┌─────────────────┐
│    Candidate    │         │      Vote       │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │ 1:N     │ id (PK)         │
│ name            │◄────────┤ candidateId(FK) │
│ videoUrl        │         │ amount          │
│ status          │         │ paymentMethod   │
│ totalVotes      │         │ transactionId   │
│ totalRevenue    │         │ paymentStatus   │
└─────────────────┘         └────────┬────────┘
                                     │ 1:1
                                     ▼
                            ┌─────────────────┐
                            │  Transaction    │
                            ├─────────────────┤
                            │ id (PK)         │
                            │ voteId (FK)     │
                            │ provider        │
                            │ providerRef     │
                            │ webhookPayload  │
                            └─────────────────┘
```

### Tables Principales

| Table | Description | Nombre estimé |
|-------|-------------|---------------|
| **admins** | Administrateurs plateforme | ~5-10 |
| **candidates** | Candidats du concours | ~50-500 |
| **votes** | Votes (1 vote = 100 FCFA) | ~5,000-50,000 |
| **transactions** | Audit paiements | ~5,000-50,000 |
| **audit_logs** | Actions admin | ~500-5,000 |
| **daily_stats** | Stats quotidiennes | ~365/an |
| **webhook_logs** | Logs webhooks | ~10,000-100,000 |

---

## 💳 Système de Paiements

### Architecture Providers

```typescript
┌───────────────────────────────────────────┐
│        PaymentsService                    │
│  (Orchestrateur central)                  │
│                                           │
│  + initializePayment(provider, params)    │
│  + getTransactionStatus(provider, ref)    │
│  + verifyWebhookSignature(provider, ...)  │
│  + refundTransaction(provider, ref)       │
└───────────┬───────────────────────────────┘
            │
            │ Factory Pattern
            ▼
   ┌────────┴────────┬──────────────┐
   │                 │              │
   ▼                 ▼              ▼
┌─────────┐   ┌────────────┐   ┌─────────┐
│   MTN   │   │   Orange   │   │ Stripe  │
│  MoMo   │   │   Money    │   │ (Cards) │
│Provider │   │  Provider  │   │Provider │
└─────────┘   └────────────┘   └─────────┘
     │              │                │
     │              │                │
     ▼              ▼                ▼
 MTN API      Orange API       Stripe API
```

### Interface Abstraite

Tous les providers implémentent `IPaymentProvider` :

```typescript
interface IPaymentProvider {
  initializePayment(params): Promise<PaymentResponse>
  getTransactionStatus(ref): Promise<TransactionStatus>
  verifyWebhookSignature(payload, sig): WebhookVerification
  refundTransaction?(ref, amount): Promise<PaymentResponse>
}
```

### Flux de Paiement Complet

```
1. User clique "Voter 100 FCFA"
       │
       ▼
2. Frontend → POST /api/votes/initiate
   {
     candidateId: "abc123",
     paymentMethod: "MTN_MOBILE_MONEY",
     voterPhone: "+225XXXXXXXX"
   }
       │
       ▼
3. Backend VotesService.createVote()
   - Créer Vote (status=PENDING)
   - Générer transactionId unique
       │
       ▼
4. Backend → PaymentsService.initializePayment()
   - Choisir provider (MTN, Orange, Stripe)
   - Appel API provider
       │
       ▼
5. Provider API retourne paymentUrl
       │
       ▼
6. Backend → Frontend : { paymentUrl, transactionId }
       │
       ▼
7. Frontend redirige vers paymentUrl
       │
       ▼
8. User paye sur interface provider
       │
       ▼
9. Provider → POST /api/webhooks/{provider}
   (webhook notification)
       │
       ▼
10. Backend vérifie signature webhook
       │
       ▼
11. Backend met à jour :
    - Vote.paymentStatus = COMPLETED
    - Candidate.totalVotes += 1
    - Candidate.totalRevenue += 100
    - Transaction créée
       │
       ▼
12. Backend → Socket.IO : emitLeaderboardUpdate()
       │
       ▼
13. Frontend reçoit update temps réel
    - Classement mis à jour automatiquement
```

---

## 🔐 Sécurité

### Authentification Admin (JWT)

```
1. Admin login → POST /api/auth/login
   { email, password, [2FA code] }
       │
       ▼
2. Backend vérifie :
   - Hash password (bcrypt)
   - Code 2FA si activé (TOTP)
       │
       ▼
3. Génère JWT tokens :
   - Access Token (15 min)
   - Refresh Token (7 jours)
       │
       ▼
4. Frontend stocke tokens (httpOnly cookies)
       │
       ▼
5. Requêtes protégées :
   Authorization: Bearer <access_token>
       │
       ▼
6. Backend vérifie avec JwtAuthGuard
```

### Anti-Fraude Votes

**Mécanismes de détection** :

1. **IP Tracking** : Max 10 votes/minute par IP
2. **Fingerprint** : Identification navigateur unique
3. **Pattern Analysis** :
   - Votes trop rapides (< 5 secondes entre votes)
   - Même IP → plusieurs candidats simultanément
   - Montant paiement ≠ 100 FCFA
4. **Transaction Validation** :
   - Webhook signature vérification
   - Status checks périodiques
5. **IP Blacklist** : Bannissement automatique

**Action sur détection** :

```typescript
if (isSuspicious) {
  vote.isSuspicious = true
  vote.suspicionReason = "Pattern anormal détecté"
  // Ne pas incrémenter totalVotes
  // Alerte admin via AuditLog
}
```

---

## 🔄 Système Temps Réel (WebSocket)

### Architecture Socket.IO

```
┌────────────────────────────────────────┐
│  Frontend (Multiple Clients)           │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │User 1│ │User 2│ │User N│           │
│  └───┬──┘ └───┬──┘ └───┬──┘           │
└──────┼────────┼────────┼───────────────┘
       │        │        │
       │ WebSocket Connections
       │        │        │
       ▼        ▼        ▼
┌────────────────────────────────────────┐
│  Backend LeaderboardGateway            │
│  (Socket.IO Server)                    │
│                                        │
│  @Interval(10000) // Toutes les 10s    │
│  emitLeaderboardUpdate() {             │
│    const top100 = getTop100()          │
│    io.emit('leaderboard:update', data) │
│  }                                     │
└────────────────────────────────────────┘
```

### Événements Socket.IO

| Événement | Direction | Description |
|-----------|-----------|-------------|
| `connection` | Client → Server | Connexion initiale |
| `leaderboard:subscribe` | Client → Server | S'abonner aux updates |
| `leaderboard:initial` | Server → Client | Envoyer état actuel |
| `leaderboard:update` | Server → All | Broadcast nouveau classement |
| `vote:success` | Server → All | Nouveau vote enregistré |

---

## 📊 Module Analytics

### Métriques Collectées

**Temps Réel** :
- Total candidats (actifs/pending/rejected)
- Total votes (aujourd'hui, ce mois, total)
- Revenus (FCFA)
- Top 10 candidats

**Quotidiennes (DailyStats)** :
- Nouveaux candidats/jour
- Votes par méthode de paiement
- Répartition géographique
- Taux de conversion

**Exports** :
- CSV : Candidats, Votes, Transactions
- Excel : Rapports mensuels
- PDF : Certificats gagnants (futur)

---

## 🎥 Gestion Vidéos (Cloudinary)

### Workflow Upload

```
1. Frontend : User sélectionne vidéo (max 60s, 50 Mo)
       │
       ▼
2. Frontend → POST /api/upload/signature
   (Demander URL signée Cloudinary)
       │
       ▼
3. Backend génère signature Cloudinary
       │
       ▼
4. Frontend upload DIRECT vers Cloudinary
   (Pas de transit par backend = économie bande passante)
       │
       ▼
5. Cloudinary traite vidéo :
   - Validation format (MP4)
   - Génération thumbnail
   - Transcodage adaptatif
   - CDN distribution
       │
       ▼
6. Cloudinary → Webhook Backend
   "Upload terminé : public_id, url"
       │
       ▼
7. Backend crée Candidate avec videoUrl
```

### Configuration Cloudinary

```javascript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Paramètres upload vidéo
{
  resource_type: 'video',
  folder: 'spotlight-lover',
  format: 'mp4',
  transformation: [
    { width: 1280, height: 720, crop: 'limit' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ],
  eager: [
    { format: 'jpg', transformation: 'thumbnail' }
  ]
}
```

---

## 🚀 Déploiement

### Environnements

| Env | Backend | Frontend | Database | URL |
|-----|---------|----------|----------|-----|
| **Dev** | Local (npm run start:dev) | Local (npm run dev) | PostgreSQL local | localhost:4000 |
| **Staging** | Railway | Vercel | Neon PostgreSQL | staging.spotlightlover.com |
| **Prod** | Railway | Vercel | Neon PostgreSQL | spotlightlover.com |

### Pipeline CI/CD

```
1. Git Push → GitHub
       │
       ▼
2. GitHub Actions déclenche :
   - Linter (ESLint)
   - Tests unitaires (Jest)
   - Tests E2E
       │
       ▼
3. Si tests OK :
   - Build backend (NestJS)
   - Build frontend (Next.js)
       │
       ▼
4. Deploy automatique :
   - Backend → Railway
   - Frontend → Vercel
       │
       ▼
5. Migrations Prisma :
   - npx prisma migrate deploy
       │
       ▼
6. Health checks post-deploy
```

---

## 📈 Performance & Scalabilité

### Optimisations Backend

1. **Database Indexing** :
   ```sql
   CREATE INDEX idx_candidates_votes ON candidates(totalVotes DESC);
   CREATE INDEX idx_votes_created ON votes(createdAt);
   CREATE INDEX idx_votes_ip ON votes(ipAddress);
   ```

2. **Query Optimization** :
   - Pagination (limit/offset)
   - Select only needed fields
   - Eager loading relations (include)

3. **Caching (Redis)** :
   - Leaderboard top 100 (TTL 10s)
   - Stats globales (TTL 60s)
   - Config paiements (TTL 1h)

4. **Rate Limiting** :
   - Global : 100 req/min par IP
   - Votes : 10 req/min par IP
   - Auth : 5 req/min par IP

### Scalabilité Horizontale

```
┌────────────────────────────────────────┐
│         Load Balancer (Railway)        │
└───────────┬────────────────────────────┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
┌────────┐ ┌────────┐ ┌────────┐
│Backend │ │Backend │ │Backend │
│Instance│ │Instance│ │Instance│
│   1    │ │   2    │ │   N    │
└────────┘ └────────┘ └────────┘
    │       │       │
    └───────┼───────┘
            ▼
    ┌────────────┐
    │ PostgreSQL │
    │  (Neon)    │
    └────────────┘
```

---

## 🔧 Configuration Variables

### Backend (.env)

```bash
# Obligatoires
DATABASE_URL=postgresql://...
JWT_SECRET=<secure-key>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Paiements (choisir providers)
MTN_MOMO_API_KEY=...
ORANGE_MONEY_CLIENT_ID=...
STRIPE_SECRET_KEY=...

# Optionnels
REDIS_HOST=localhost
SENTRY_DSN=...
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📞 Support & Maintenance

### Monitoring

- **Logs** : Winston (backend) + Vercel Logs (frontend)
- **Errors** : Sentry (tracking exceptions)
- **Uptime** : UptimeRobot (checks toutes les 5 min)
- **Metrics** : PostgreSQL slow queries, API response times

### Backup Strategy

- **Database** : Backup quotidien automatique (Neon)
- **Vidéos** : Cloudinary (stockage persistant)
- **Code** : Git (GitHub)

---

**Document maintenu par** : Équipe Spotlight Lover  
**Dernière mise à jour** : 2025-01-06  
**Version** : 1.0.0
