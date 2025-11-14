# Module Votes - Spotlight Lover

Module de gestion des votes avec intégration complète des paiements (MTN Mobile Money, Orange Money, Stripe).

## 📋 Vue d'ensemble

Le module Votes gère :
- ✅ **Création de votes** avec initialisation automatique du paiement
- ✅ **Traitement des webhooks** pour confirmation des paiements
- ✅ **Mise à jour des statistiques** candidats (votes, revenus)
- ✅ **Anti-fraude** avec vérification IP blacklist
- ✅ **Transactions** avec audit trail complet
- ✅ **Requêtes avancées** avec filtres, tri et pagination

## 🎯 Modèles de données

### Vote
```prisma
model Vote {
  id              String        @id @default(uuid())
  candidateId     String
  voterEmail      String?
  voterPhone      String?
  voterName       String?
  amount          Int           @default(100)  // 100 FCFA
  currency        String        @default("XOF")
  paymentMethod   PaymentMethod
  paymentProvider String        // "mtn", "orange", "stripe"
  transactionId   String        @unique  // Notre référence
  providerTxId    String?       @unique  // Référence provider
  paymentStatus   PaymentStatus @default(PENDING)
  ipAddress       String
  userAgent       String?
  isSuspicious    Boolean       @default(false)
  paidAt          DateTime?
  createdAt       DateTime      @default(now())
  
  candidate       Candidate     @relation
  transaction     Transaction?
}
```

### Transaction
```prisma
model Transaction {
  id                String        @id @default(uuid())
  voteId            String        @unique
  amount            Int
  currency          String        @default("XOF")
  paymentMethod     PaymentMethod
  provider          String
  providerReference String        @unique
  status            PaymentStatus @default(PENDING)
  initResponse      Json?         // Réponse initialisation
  webhookPayload    Json?         // Payload webhook
  statusResponse    Json?         // Réponse vérification
  customerEmail     String?
  customerPhone     String?
  createdAt         DateTime      @default(now())
  
  vote              Vote          @relation
}
```

## 🌐 Endpoints API

### PUBLIC - Créer un vote

**POST** `/votes`

Crée un nouveau vote et initialise le paiement.

**Request Body:**
```json
{
  "candidateId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentMethod": "MTN_MOBILE_MONEY",
  "phone": "+237677889900",
  "email": "voter@example.com",
  "voterName": "Jean Dupont",
  "message": "Bravo ! Continue comme ça !"
}
```

**Validation:**
- `candidateId` (required): UUID du candidat
- `paymentMethod` (required): `MTN_MOBILE_MONEY`, `ORANGE_MONEY`, `CARD`
- `phone` (required pour MTN/Orange): Format international
- `email` (required pour CARD): Email valide
- `voterName` (optional): Max 100 caractères
- `message` (optional): Max 200 caractères

**Response 201:**
```json
{
  "success": true,
  "message": "Vote créé avec succès. Veuillez compléter le paiement.",
  "data": {
    "vote": {
      "id": "vote-uuid",
      "candidateId": "candidate-uuid",
      "amount": 100,
      "paymentMethod": "MTN_MOBILE_MONEY",
      "paymentStatus": "PENDING",
      "transactionId": "VOTE-20240114-ABC123",
      "providerTxId": "provider-ref-123",
      "candidate": {
        "id": "candidate-uuid",
        "name": "Alice Kamara",
        "videoUrl": "https://...",
        "thumbnailUrl": "https://..."
      }
    },
    "payment": {
      "success": true,
      "checkoutUrl": "https://pay.mtn.cm/...",
      "providerReference": "provider-ref-123",
      "message": "Paiement initialis\u00e9"
    }
  }
}
```

**Erreurs:**
- `404`: Candidat introuvable
- `400`: Candidat pas encore validé
- `403`: IP bloquée
- `400`: Données manquantes selon méthode de paiement

**Test cURL:**
```bash
# Vote avec MTN Mobile Money
curl -X POST http://localhost:4000/votes \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "550e8400-e29b-41d4-a716-446655440000",
    "paymentMethod": "MTN_MOBILE_MONEY",
    "phone": "+237677889900",
    "voterName": "Jean Dupont"
  }'

# Vote avec Stripe (carte bancaire)
curl -X POST http://localhost:4000/votes \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "550e8400-e29b-41d4-a716-446655440000",
    "paymentMethod": "CARD",
    "email": "voter@example.com",
    "voterName": "Jean Dupont"
  }'
```

---

### PUBLIC - Récupérer un vote

**GET** `/votes/:id`

Récupère les détails d'un vote.

**Response 200:**
```json
{
  "success": true,
  "message": "Vote récupéré avec succès",
  "data": {
    "id": "vote-uuid",
    "candidateId": "candidate-uuid",
    "voterName": "Jean Dupont",
    "voterPhone": "+237677889900",
    "amount": 100,
    "paymentMethod": "MTN_MOBILE_MONEY",
    "paymentStatus": "COMPLETED",
    "transactionId": "VOTE-20240114-ABC123",
    "providerTxId": "provider-ref-123",
    "paidAt": "2024-01-14T10:30:00Z",
    "createdAt": "2024-01-14T10:25:00Z",
    "candidate": {
      "id": "candidate-uuid",
      "name": "Alice Kamara",
      "videoUrl": "https://...",
      "thumbnailUrl": "https://...",
      "status": "APPROVED"
    },
    "transaction": {
      "id": "tx-uuid",
      "provider": "mtn",
      "providerReference": "provider-ref-123",
      "status": "COMPLETED"
    }
  }
}
```

**Test cURL:**
```bash
curl http://localhost:4000/votes/vote-uuid
```

---

### PUBLIC - Vérifier le statut d'un paiement

**GET** `/votes/:id/status`

Interroge le provider de paiement pour obtenir le statut actuel.

**Response 200:**
```json
{
  "success": true,
  "message": "Statut vérifié avec succès",
  "data": {
    "id": "vote-uuid",
    "paymentStatus": "COMPLETED",
    "paidAt": "2024-01-14T10:30:00Z",
    "providerTxId": "provider-ref-123"
  }
}
```

**Test cURL:**
```bash
curl http://localhost:4000/votes/vote-uuid/status
```

---

### ADMIN - Lister tous les votes

**GET** `/votes`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

**Query Parameters:**
- `candidateId` (optional): UUID du candidat
- `paymentMethod` (optional): `MTN_MOBILE_MONEY`, `ORANGE_MONEY`, `CARD`
- `paymentStatus` (optional): `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`
- `phone` (optional): Numéro de téléphone (recherche partielle)
- `transactionRef` (optional): ID de transaction
- `startDate` (optional): Date début (ISO 8601)
- `endDate` (optional): Date fin (ISO 8601)
- `sortBy` (optional): `createdAt`, `amount`, `paymentStatus` (défaut: `createdAt`)
- `sortOrder` (optional): `asc`, `desc` (défaut: `desc`)
- `page` (optional): Numéro de page (défaut: 1)
- `limit` (optional): Éléments par page (défaut: 20)

**Response 200:**
```json
{
  "success": true,
  "message": "Votes récupérés avec succès",
  "data": [
    {
      "id": "vote-uuid",
      "candidateId": "candidate-uuid",
      "voterName": "Jean Dupont",
      "amount": 100,
      "paymentMethod": "MTN_MOBILE_MONEY",
      "paymentStatus": "COMPLETED",
      "createdAt": "2024-01-14T10:25:00Z",
      "candidate": {
        "id": "candidate-uuid",
        "name": "Alice Kamara"
      },
      "transaction": {
        "provider": "mtn",
        "status": "COMPLETED"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Test cURL:**
```bash
# Avec authentification
curl -X GET "http://localhost:4000/votes?candidateId=550e8400-e29b-41d4-a716-446655440000&paymentStatus=COMPLETED&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Filtrer par date
curl -X GET "http://localhost:4000/votes?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### ADMIN - Statistiques des votes

**GET** `/votes/stats`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

**Query Parameters:**
- `candidateId` (optional): UUID du candidat (si absent, stats globales)

**Response 200:**
```json
{
  "success": true,
  "message": "Statistiques récupérées avec succès",
  "data": {
    "total": {
      "votes": 1523,
      "revenue": 152300
    },
    "byMethod": [
      {
        "method": "MTN_MOBILE_MONEY",
        "count": 890,
        "revenue": 89000
      },
      {
        "method": "ORANGE_MONEY",
        "count": 523,
        "revenue": 52300
      },
      {
        "method": "CARD",
        "count": 110,
        "revenue": 11000
      }
    ],
    "byStatus": [
      {
        "status": "COMPLETED",
        "count": 1523
      },
      {
        "status": "PENDING",
        "count": 45
      },
      {
        "status": "FAILED",
        "count": 12
      }
    ],
    "history": [
      {
        "date": "2024-01-14",
        "count": 120
      }
    ]
  }
}
```

**Test cURL:**
```bash
# Stats globales
curl http://localhost:4000/votes/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Stats pour un candidat
curl "http://localhost:4000/votes/stats?candidateId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### ADMIN - Top votants

**GET** `/votes/top-voters`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

**Query Parameters:**
- `limit` (optional): Nombre de résultats (défaut: 20)

**Response 200:**
```json
{
  "success": true,
  "message": "Top votants récupérés avec succès",
  "data": [
    {
      "phone": "+237677889900",
      "totalVotes": 45,
      "totalSpent": 4500
    },
    {
      "phone": "+237699112233",
      "totalVotes": 32,
      "totalSpent": 3200
    }
  ]
}
```

**Test cURL:**
```bash
curl "http://localhost:4000/votes/top-voters?limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔔 Webhooks

### MTN Mobile Money Webhook

**POST** `/webhooks/mtn`

Endpoint appelé par MTN pour confirmer les paiements.

**Request Body:**
```json
{
  "referenceId": "provider-ref-123",
  "externalId": "VOTE-20240114-ABC123",
  "amount": 100,
  "currency": "XAF",
  "status": "SUCCESSFUL",
  "payer": {
    "partyIdType": "MSISDN",
    "partyId": "237677889900"
  }
}
```

**Statuts MTN:**
- `SUCCESSFUL`: Paiement réussi → `COMPLETED`
- `FAILED`: Paiement échoué → `FAILED`
- `PENDING`: En attente → `PENDING`

---

### Orange Money Webhook

**POST** `/webhooks/orange`

Endpoint appelé par Orange Money pour confirmer les paiements.

**Request Body:**
```json
{
  "pay_token": "provider-ref-123",
  "order_id": "VOTE-20240114-ABC123",
  "amount": 100,
  "status": "SUCCESS",
  "txnid": "OM-123456789",
  "customer_msisdn": "237699112233"
}
```

**Statuts Orange:**
- `SUCCESS`: Paiement réussi → `COMPLETED`
- `FAILED`: Paiement échoué → `FAILED`
- `PENDING`: En attente → `PENDING`
- `EXPIRED`: Expiré → `CANCELLED`

---

### Stripe Webhook

**POST** `/webhooks/stripe`

Endpoint appelé par Stripe pour les événements de paiement.

**Headers:**
```
Stripe-Signature: t=timestamp,v1=signature
```

**Request Body:**
```json
{
  "id": "evt_123456",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123",
      "payment_status": "paid",
      "metadata": {
        "transactionRef": "VOTE-20240114-ABC123"
      }
    }
  },
  "created": 1705234567,
  "livemode": false
}
```

**Événements traités:**
- `checkout.session.completed`: Session complétée
- `payment_intent.succeeded`: Paiement réussi
- `payment_intent.payment_failed`: Paiement échoué

---

## 🔒 Sécurité

### Vérification IP Blacklist

Avant de créer un vote, le système vérifie que l'adresse IP n'est pas bloquée :

```typescript
const isBlacklisted = await this.prisma.ipBlacklist.findFirst({
  where: {
    ipAddress,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ]
  }
});
```

### Validation des candidats

Seuls les candidats avec statut `APPROVED` peuvent recevoir des votes.

### Vérification des webhooks

Toutes les signatures de webhooks sont vérifiées avant traitement :
- **MTN**: Signature HMAC
- **Orange Money**: Token de vérification
- **Stripe**: Signature avec webhook secret

### Logging des webhooks

Tous les webhooks reçus sont enregistrés dans `WebhookLog` pour audit et debugging.

---

## 💰 Flux de paiement complet

### 1. Initialisation du vote

```
Frontend → POST /votes
          ↓
   VotesService.create()
          ↓
   Validation (candidat, IP, données)
          ↓
   Création Vote (PENDING)
          ↓
   PaymentsService.initializePayment()
          ↓
   Mise à jour Vote (providerTxId)
          ↓
   Création Transaction
          ↓
   Response avec checkoutUrl
```

### 2. Paiement utilisateur

```
Frontend → Redirect vers checkoutUrl
          ↓
   Utilisateur paie sur plateforme provider
          ↓
   Provider traite le paiement
          ↓
   Provider envoie webhook
```

### 3. Confirmation webhook

```
Provider → POST /webhooks/[mtn|orange|stripe]
          ↓
   Vérification signature
          ↓
   Logging WebhookLog
          ↓
   VotesService.confirmPayment()
          ↓
   Mise à jour Vote (COMPLETED, paidAt)
          ↓
   Mise à jour Transaction (webhookPayload)
          ↓
   Mise à jour Candidate (totalVotes, totalRevenue)
          ↓
   Response 200 OK
```

---

## 🧪 Tests

### Test complet avec MTN Mobile Money

```bash
# 1. Créer un vote
VOTE_RESPONSE=$(curl -s -X POST http://localhost:4000/votes \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "candidate-uuid",
    "paymentMethod": "MTN_MOBILE_MONEY",
    "phone": "+237677889900",
    "voterName": "Test Voter"
  }')

# Extraire l'ID du vote
VOTE_ID=$(echo $VOTE_RESPONSE | jq -r '.data.vote.id')
echo "Vote créé: $VOTE_ID"

# 2. Vérifier le statut
curl http://localhost:4000/votes/$VOTE_ID/status

# 3. Simuler webhook MTN (en dev)
curl -X POST http://localhost:4000/webhooks/mtn \
  -H "Content-Type: application/json" \
  -d '{
    "referenceId": "provider-ref",
    "externalId": "VOTE-20240114-ABC123",
    "amount": 100,
    "currency": "XAF",
    "status": "SUCCESSFUL"
  }'

# 4. Vérifier que le vote est COMPLETED
curl http://localhost:4000/votes/$VOTE_ID
```

---

## 📊 Variables d'environnement

Ajouter dans `.env`:

```env
# URLs pour les callbacks et webhooks
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:4000

# MTN Mobile Money
MTN_API_URL=https://sandbox.momodeveloper.mtn.com
MTN_SUBSCRIPTION_KEY=your_key
MTN_API_USER=your_user_id
MTN_API_KEY=your_api_key

# Orange Money
ORANGE_API_URL=https://api.orange.com/orange-money-webpay
ORANGE_MERCHANT_KEY=your_merchant_key
ORANGE_CLIENT_ID=your_client_id
ORANGE_CLIENT_SECRET=your_client_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🔄 Intégration avec Candidates Module

Le module Votes met automatiquement à jour les statistiques des candidats :

```typescript
// Dans confirmPayment() si status === COMPLETED
await this.prisma.candidate.update({
  where: { id: vote.candidateId },
  data: {
    totalVotes: { increment: 1 },
    totalRevenue: { increment: vote.amount }
  }
});
```

---

## 📝 Modèle de réponse standard

Tous les endpoints suivent ce format :

```typescript
{
  success: boolean;
  message: string;
  data?: any;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## 🚀 Prochaines étapes

- [ ] Tests unitaires pour VotesService
- [ ] Tests E2E pour les webhooks
- [ ] Rate limiting sur les endpoints de vote
- [ ] Système de retry automatique pour webhooks échoués
- [ ] Dashboard analytics en temps réel
