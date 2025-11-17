# Module Analytics - Spotlight Lover

Module d'analyse et de statistiques pour le dashboard administrateur avec métriques complètes et export de données.

## 📋 Vue d'ensemble

Le module Analytics fournit :
- ✅ **Dashboard complet** avec toutes les métriques clés
- ✅ **Statistiques de votes** (par jour, méthode, status, heure)
- ✅ **Statistiques de candidats** (par pays, status, top performers)
- ✅ **Statistiques financières** (revenus, conversion, projections)
- ✅ **Statistiques d'engagement** (vues, partages, top contenu)
- ✅ **Séries temporelles** pour graphiques
- ✅ **Export CSV** des données (votes, candidats, transactions)
- ✅ **Statistiques par période** (aujourd'hui, semaine, mois)
- ✅ **Top votants** et métriques de conversion
- ✅ **Stats blacklist IP** pour anti-fraude

## 🎯 Métriques calculées

### Overview (Vue d'ensemble)
- Total candidats
- Total votes (complétés)
- Total revenus (FCFA)
- Total utilisateurs uniques
- Moyenne votes par candidat
- Taux de conversion global

### Candidats
- Répartition par statut (PENDING, APPROVED, REJECTED, SUSPENDED)
- Répartition par pays
- Top 5 performers (plus de votes)
- 5 candidats récemment ajoutés

### Votes
- Répartition par méthode de paiement (MTN, Orange, Stripe)
- Répartition par statut (COMPLETED, PENDING, FAILED, CANCELLED)
- Votes par jour (30 derniers jours)
- Distribution horaire (0-23h)

### Financier
- Total revenus
- Revenus par méthode de paiement (avec pourcentages)
- Revenus quotidiens (30 derniers jours)
- Valeur moyenne d'une commande
- Projection revenus mensuels

### Engagement
- Total vues vidéos
- Total partages
- Top 5 candidats les plus vus
- Top 5 candidats les plus partagés

## 🌐 Endpoints API

### ADMIN - Dashboard complet

**GET** `/analytics/dashboard`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

Récupère toutes les statistiques pour le dashboard administrateur.

**Response 200:**
```json
{
  "success": true,
  "message": "Statistiques du dashboard récupérées avec succès",
  "data": {
    "overview": {
      "totalCandidates": 50,
      "totalVotes": 1523,
      "totalRevenue": 152300,
      "totalUsers": 876,
      "averageVotesPerCandidate": 30,
      "conversionRate": 87
    },
    "candidates": {
      "byStatus": [
        { "status": "APPROVED", "count": 35 },
        { "status": "PENDING", "count": 10 },
        { "status": "REJECTED", "count": 5 }
      ],
      "byCountry": [
        { "country": "Cameroun", "count": 20, "votes": 650 },
        { "country": "Côte d'Ivoire", "count": 15, "votes": 480 }
      ],
      "topPerformers": [
        {
          "id": "...",
          "name": "Alice Kamara",
          "country": "Cameroun",
          "totalVotes": 234,
          "totalRevenue": 23400,
          "thumbnailUrl": "https://..."
        }
      ],
      "recentlyAdded": [...]
    },
    "votes": {
      "byPaymentMethod": [
        { "method": "MTN_MOBILE_MONEY", "count": 890, "revenue": 89000 },
        { "method": "ORANGE_MONEY", "count": 523, "revenue": 52300 },
        { "method": "CARD", "count": 110, "revenue": 11000 }
      ],
      "byStatus": [
        { "status": "COMPLETED", "count": 1523 },
        { "status": "PENDING", "count": 45 },
        { "status": "FAILED", "count": 12 }
      ],
      "byDay": [
        { "date": "2024-01-14", "count": 120, "revenue": 12000 }
      ],
      "hourlyDistribution": [
        { "hour": 0, "count": 15 },
        { "hour": 1, "count": 8 }
      ]
    },
    "financial": {
      "totalRevenue": 152300,
      "revenueByMethod": [
        { "method": "MTN_MOBILE_MONEY", "revenue": 89000, "percentage": 58 },
        { "method": "ORANGE_MONEY", "revenue": 52300, "percentage": 34 },
        { "method": "CARD", "revenue": 11000, "percentage": 7 }
      ],
      "dailyRevenue": [
        { "date": "2024-01-14", "revenue": 12000 }
      ],
      "averageOrderValue": 100,
      "projectedMonthlyRevenue": 152300
    },
    "engagement": {
      "totalViews": 45892,
      "totalShares": 1234,
      "mostViewedCandidates": [...],
      "mostSharedCandidates": [...]
    }
  }
}
```

**Test cURL:**
```bash
curl -X GET http://localhost:4000/analytics/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### ADMIN - Statistiques par période

**GET** `/analytics/period?type=today|week|month`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

**Query Parameters:**
- `type`: `today`, `week`, ou `month` (défaut: `today`)

**Response 200:**
```json
{
  "success": true,
  "message": "Statistiques de la période 'today' récupérées avec succès",
  "data": {
    "period": "today",
    "startDate": "2024-01-14T00:00:00.000Z",
    "endDate": "2024-01-14T23:59:59.999Z",
    "votes": 120,
    "revenue": 12000,
    "newCandidates": 3
  }
}
```

**Test cURL:**
```bash
# Aujourd'hui
curl "http://localhost:4000/analytics/period?type=today" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Cette semaine
curl "http://localhost:4000/analytics/period?type=week" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Ce mois
curl "http://localhost:4000/analytics/period?type=month" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### ADMIN - Série temporelle

**GET** `/analytics/time-series?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

Données pour graphiques avec évolution temporelle.

**Query Parameters:**
- `startDate` (optional): Date de début (ISO 8601)
- `endDate` (optional): Date de fin (ISO 8601)
- Par défaut: 30 derniers jours

**Response 200:**
```json
{
  "success": true,
  "message": "Données de série temporelle récupérées avec succès",
  "data": {
    "startDate": "2023-12-15T00:00:00.000Z",
    "endDate": "2024-01-14T23:59:59.999Z",
    "series": [
      {
        "date": "2023-12-15",
        "votes": 45,
        "revenue": 4500,
        "candidates": 2
      },
      {
        "date": "2023-12-16",
        "votes": 52,
        "revenue": 5200,
        "candidates": 1
      }
    ]
  }
}
```

**Test cURL:**
```bash
# 30 derniers jours (défaut)
curl http://localhost:4000/analytics/time-series \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Période personnalisée
curl "http://localhost:4000/analytics/time-series?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### ADMIN - Statistiques de conversion

**GET** `/analytics/conversion`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

Analyse détaillée du funnel de conversion des votes.

**Response 200:**
```json
{
  "success": true,
  "message": "Statistiques de conversion récupérées avec succès",
  "data": {
    "total": 1580,
    "completed": 1523,
    "pending": 45,
    "failed": 12,
    "cancelled": 0,
    "conversionRate": 96,
    "failureRate": 1,
    "pendingRate": 3
  }
}
```

**Test cURL:**
```bash
curl http://localhost:4000/analytics/conversion \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### ADMIN - Top votants

**GET** `/analytics/top-voters?limit=10`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

**Query Parameters:**
- `limit` (optional): Nombre de résultats (défaut: 10)

**Response 200:**
```json
{
  "success": true,
  "message": "Top votants récupérés avec succès",
  "data": [
    {
      "rank": 1,
      "phone": "+237677889900",
      "totalVotes": 45,
      "totalSpent": 4500
    },
    {
      "rank": 2,
      "phone": "+237699112233",
      "totalVotes": 32,
      "totalSpent": 3200
    }
  ]
}
```

**Test cURL:**
```bash
curl "http://localhost:4000/analytics/top-voters?limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### ADMIN - Statistiques IP blacklist

**GET** `/analytics/blacklist`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

**Response 200:**
```json
{
  "success": true,
  "message": "Statistiques de blacklist récupérées avec succès",
  "data": {
    "total": 15,
    "active": 10,
    "expired": 5,
    "recent": [
      {
        "ipAddress": "192.168.1.100",
        "reason": "Activité suspecte - votes multiples",
        "createdAt": "2024-01-14T10:30:00.000Z",
        "expiresAt": null
      }
    ]
  }
}
```

**Test cURL:**
```bash
curl http://localhost:4000/analytics/blacklist \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### ADMIN - Export CSV

**GET** `/analytics/export/csv?type=votes|candidates|transactions`

🔒 **Authentification requise** (SUPER_ADMIN, MODERATOR)

Télécharge un fichier CSV avec les données exportées.

**Query Parameters:**
- `type`: `votes`, `candidates`, ou `transactions` (requis)

**Response 200:**
- **Content-Type**: `text/csv`
- **Content-Disposition**: `attachment; filename="[type]-YYYY-MM-DD.csv"`

**Formats CSV:**

**Votes CSV:**
```csv
ID,Candidat,Pays,Montant,Méthode,Statut,Téléphone,Email,Date
vote-uuid,"Alice Kamara",Cameroun,100,MTN_MOBILE_MONEY,COMPLETED,+237677889900,,2024-01-14T10:30:00.000Z
```

**Candidats CSV:**
```csv
ID,Nom,Âge,Pays,Ville,Statut,Total Votes,Total Revenus,Vues,Partages,Date Création
candidate-uuid,"Alice Kamara",25,Cameroun,Yaoundé,APPROVED,234,23400,5892,123,2024-01-01T10:00:00.000Z
```

**Transactions CSV:**
```csv
ID,Candidat,Montant,Devise,Méthode,Provider,Référence Provider,Statut,Date
tx-uuid,"Alice Kamara",100,XOF,MTN_MOBILE_MONEY,mtn,MTN-REF-123,COMPLETED,2024-01-14T10:30:00.000Z
```

**Test cURL:**
```bash
# Export votes
curl "http://localhost:4000/analytics/export/csv?type=votes" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o votes.csv

# Export candidats
curl "http://localhost:4000/analytics/export/csv?type=candidates" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o candidates.csv

# Export transactions
curl "http://localhost:4000/analytics/export/csv?type=transactions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o transactions.csv
```

---

## 📊 Utilisation des données pour graphiques

### Graphique des votes par jour (Line Chart)

```javascript
// Récupérer les données
const response = await fetch('/analytics/time-series', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// Préparer pour Chart.js
const chartData = {
  labels: data.series.map(item => item.date),
  datasets: [
    {
      label: 'Votes',
      data: data.series.map(item => item.votes),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    },
    {
      label: 'Revenus (FCFA)',
      data: data.series.map(item => item.revenue),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }
  ]
};
```

### Graphique des méthodes de paiement (Pie Chart)

```javascript
const response = await fetch('/analytics/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

const chartData = {
  labels: data.votes.byPaymentMethod.map(item => item.method),
  datasets: [{
    data: data.votes.byPaymentMethod.map(item => item.count),
    backgroundColor: [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)'
    ]
  }]
};
```

### Graphique de distribution horaire (Bar Chart)

```javascript
const response = await fetch('/analytics/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

const chartData = {
  labels: data.votes.hourlyDistribution.map(item => `${item.hour}h`),
  datasets: [{
    label: 'Votes par heure',
    data: data.votes.hourlyDistribution.map(item => item.count),
    backgroundColor: 'rgba(75, 192, 192, 0.8)'
  }]
};
```

---

## 🎨 Exemple d'intégration Dashboard (React)

```javascript
import { useEffect, useState } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';

function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const { data } = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="dashboard">
      {/* Overview Cards */}
      <div className="stats-cards">
        <div className="card">
          <h3>Total Candidats</h3>
          <p className="stat-value">{stats.overview.totalCandidates}</p>
        </div>
        <div className="card">
          <h3>Total Votes</h3>
          <p className="stat-value">{stats.overview.totalVotes}</p>
        </div>
        <div className="card">
          <h3>Total Revenus</h3>
          <p className="stat-value">{stats.overview.totalRevenue} FCFA</p>
        </div>
        <div className="card">
          <h3>Taux de Conversion</h3>
          <p className="stat-value">{stats.overview.conversionRate}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Votes par méthode */}
        <div className="chart-container">
          <h3>Votes par Méthode de Paiement</h3>
          <Pie data={{
            labels: stats.votes.byPaymentMethod.map(i => i.method),
            datasets: [{
              data: stats.votes.byPaymentMethod.map(i => i.count),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
            }]
          }} />
        </div>

        {/* Distribution horaire */}
        <div className="chart-container">
          <h3>Distribution Horaire des Votes</h3>
          <Bar data={{
            labels: stats.votes.hourlyDistribution.map(i => `${i.hour}h`),
            datasets: [{
              label: 'Votes',
              data: stats.votes.hourlyDistribution.map(i => i.count),
              backgroundColor: 'rgba(75, 192, 192, 0.8)'
            }]
          }} />
        </div>
      </div>

      {/* Top Performers */}
      <div className="top-performers">
        <h3>Top Performers</h3>
        {stats.candidates.topPerformers.map((candidate, index) => (
          <div key={candidate.id} className="performer-card">
            <span className="rank">#{index + 1}</span>
            <img src={candidate.thumbnailUrl} alt={candidate.name} />
            <div className="info">
              <h4>{candidate.name}</h4>
              <p>{candidate.country}</p>
              <p>{candidate.totalVotes} votes • {candidate.totalRevenue} FCFA</p>
            </div>
          </div>
        ))}
      </div>

      {/* Export Actions */}
      <div className="export-actions">
        <button onClick={() => downloadCSV('votes')}>
          📥 Exporter Votes
        </button>
        <button onClick={() => downloadCSV('candidates')}>
          📥 Exporter Candidats
        </button>
        <button onClick={() => downloadCSV('transactions')}>
          📥 Exporter Transactions
        </button>
      </div>
    </div>
  );
}

function downloadCSV(type) {
  const token = localStorage.getItem('accessToken');
  const url = `/analytics/export/csv?type=${type}`;
  
  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  });
}

export default AnalyticsDashboard;
```

---

## 🔒 Sécurité

- ✅ Tous les endpoints sont protégés par JWT
- ✅ Rôles requis: `SUPER_ADMIN` ou `MODERATOR`
- ✅ Les exports CSV sont limités à 10,000 lignes
- ✅ Les requêtes SQL utilisent des requêtes paramétrées
- ✅ Pas d'exposition de données sensibles (mots de passe, tokens)

---

## ⚡ Performance

- **Requêtes optimisées** avec agrégations Prisma
- **Index sur colonnes** de tri et filtrage
- **Limitation des résultats** pour exports
- **Calculs en parallèle** avec Promise.all
- **Cache recommandé** pour dashboard (Redis)

---

## 📝 Notes techniques

### Requêtes SQL brutes

Certaines statistiques utilisent `$queryRaw` pour des requêtes complexes :
- Votes par jour avec GROUP BY DATE
- Distribution horaire avec EXTRACT(HOUR)

### Format CSV

Les exports CSV utilisent:
- Encodage UTF-8
- Séparateur virgule (,)
- Guillemets pour champs texte
- Format ISO 8601 pour dates

---

## 🚀 Prochaines étapes

- [ ] Cache Redis pour dashboard (TTL 5 min)
- [ ] Export Excel avec formatage avancé
- [ ] Graphiques PDF générés côté serveur
- [ ] Planification d'exports automatiques (daily, weekly)
- [ ] Alertes email pour métriques critiques
- [ ] API pour webhooks externes (Zapier, Make)
