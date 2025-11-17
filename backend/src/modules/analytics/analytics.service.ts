import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, CandidateStatus, PaymentMethod } from '@prisma/client';

export interface DashboardStats {
  overview: {
    totalCandidates: number;
    totalVotes: number;
    totalRevenue: number;
    totalUsers: number; // Votants uniques
    averageVotesPerCandidate: number;
    conversionRate: number; // Votes COMPLETED / Total votes
  };
  candidates: {
    byStatus: { status: string; count: number }[];
    byCountry: { country: string; count: number; votes: number }[];
    topPerformers: any[];
    recentlyAdded: any[];
  };
  votes: {
    byPaymentMethod: { method: string; count: number; revenue: number }[];
    byStatus: { status: string; count: number }[];
    byDay: { date: string; count: number; revenue: number }[];
    hourlyDistribution: { hour: number; count: number }[];
  };
  financial: {
    totalRevenue: number;
    revenueByMethod: { method: string; revenue: number; percentage: number }[];
    dailyRevenue: { date: string; revenue: number }[];
    averageOrderValue: number;
    projectedMonthlyRevenue: number;
  };
  engagement: {
    totalViews: number;
    totalShares: number;
    mostViewedCandidates: any[];
    mostSharedCandidates: any[];
  };
}

export interface TimeSeriesData {
  date: string;
  votes: number;
  revenue: number;
  candidates: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupérer le dashboard complet avec toutes les statistiques
   */
  async getDashboardStats(): Promise<DashboardStats> {
    this.logger.log('📊 Calcul des statistiques du dashboard...');

    const [
      overview,
      candidatesStats,
      votesStats,
      financialStats,
      engagementStats,
    ] = await Promise.all([
      this.getOverviewStats(),
      this.getCandidatesStats(),
      this.getVotesStats(),
      this.getFinancialStats(),
      this.getEngagementStats(),
    ]);

    return {
      overview,
      candidates: candidatesStats,
      votes: votesStats,
      financial: financialStats,
      engagement: engagementStats,
    };
  }

  /**
   * Statistiques générales (overview)
   */
  private async getOverviewStats() {
    // Total candidats
    const totalCandidates = await this.prisma.candidate.count();

    // Total votes
    const totalVotes = await this.prisma.vote.count();

    // Votes complétés
    const completedVotes = await this.prisma.vote.count({
      where: { paymentStatus: PaymentStatus.COMPLETED },
    });

    // Total revenus
    const revenueData = await this.prisma.vote.aggregate({
      where: { paymentStatus: PaymentStatus.COMPLETED },
      _sum: { amount: true },
    });
    const totalRevenue = revenueData._sum.amount || 0;

    // Votants uniques (par téléphone)
    const uniqueVoters = await this.prisma.vote.groupBy({
      by: ['voterPhone'],
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        voterPhone: { not: null },
      },
    });
    const totalUsers = uniqueVoters.length;

    // Moyenne votes par candidat
    const averageVotesPerCandidate =
      totalCandidates > 0 ? Math.round(completedVotes / totalCandidates) : 0;

    // Taux de conversion
    const conversionRate =
      totalVotes > 0 ? Math.round((completedVotes / totalVotes) * 100) : 0;

    return {
      totalCandidates,
      totalVotes: completedVotes,
      totalRevenue,
      totalUsers,
      averageVotesPerCandidate,
      conversionRate,
    };
  }

  /**
   * Statistiques des candidats
   */
  private async getCandidatesStats() {
    // Par statut
    const byStatus = await this.prisma.candidate.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Par pays
    const byCountry = await this.prisma.candidate.groupBy({
      by: ['country'],
      _count: { id: true },
      _sum: { totalVotes: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Top performers
    const topPerformers = await this.prisma.candidate.findMany({
      where: { status: CandidateStatus.APPROVED },
      orderBy: { totalVotes: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        country: true,
        totalVotes: true,
        totalRevenue: true,
        thumbnailUrl: true,
      },
    });

    // Récemment ajoutés
    const recentlyAdded = await this.prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        country: true,
        status: true,
        createdAt: true,
        thumbnailUrl: true,
      },
    });

    return {
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      byCountry: byCountry.map((item) => ({
        country: item.country,
        count: item._count.id,
        votes: item._sum.totalVotes || 0,
      })),
      topPerformers,
      recentlyAdded,
    };
  }

  /**
   * Statistiques des votes
   */
  private async getVotesStats() {
    // Par méthode de paiement
    const byPaymentMethod = await this.prisma.vote.groupBy({
      by: ['paymentMethod'],
      where: { paymentStatus: PaymentStatus.COMPLETED },
      _count: { id: true },
      _sum: { amount: true },
    });

    // Par statut
    const byStatus = await this.prisma.vote.groupBy({
      by: ['paymentStatus'],
      _count: { id: true },
    });

    // Par jour (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const votesByDay = await this.prisma.$queryRaw<
      { date: string; count: bigint; revenue: bigint }[]
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(amount) as revenue
      FROM votes
      WHERE payment_status = 'COMPLETED'
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Distribution horaire
    const hourlyDistribution = await this.prisma.$queryRaw<
      { hour: number; count: bigint }[]
    >`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM votes
      WHERE payment_status = 'COMPLETED'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour ASC
    `;

    return {
      byPaymentMethod: byPaymentMethod.map((item) => ({
        method: item.paymentMethod,
        count: item._count.id,
        revenue: item._sum.amount || 0,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.paymentStatus,
        count: item._count.id,
      })),
      byDay: votesByDay.map((item) => ({
        date: item.date,
        count: Number(item.count),
        revenue: Number(item.revenue),
      })),
      hourlyDistribution: hourlyDistribution.map((item) => ({
        hour: Number(item.hour),
        count: Number(item.count),
      })),
    };
  }

  /**
   * Statistiques financières
   */
  private async getFinancialStats() {
    // Total revenus
    const revenueData = await this.prisma.vote.aggregate({
      where: { paymentStatus: PaymentStatus.COMPLETED },
      _sum: { amount: true },
      _count: { id: true },
    });
    const totalRevenue = revenueData._sum.amount || 0;
    const completedVotes = revenueData._count.id;

    // Revenus par méthode
    const revenueByMethodData = await this.prisma.vote.groupBy({
      by: ['paymentMethod'],
      where: { paymentStatus: PaymentStatus.COMPLETED },
      _sum: { amount: true },
    });

    const revenueByMethod = revenueByMethodData.map((item) => ({
      method: item.paymentMethod,
      revenue: item._sum.amount || 0,
      percentage:
        totalRevenue > 0
          ? Math.round(((item._sum.amount || 0) / totalRevenue) * 100)
          : 0,
    }));

    // Revenus quotidiens (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenueData = await this.prisma.$queryRaw<
      { date: string; revenue: bigint }[]
    >`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as revenue
      FROM votes
      WHERE payment_status = 'COMPLETED'
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const dailyRevenue = dailyRevenueData.map((item) => ({
      date: item.date,
      revenue: Number(item.revenue),
    }));

    // Valeur moyenne d'une commande (vote)
    const averageOrderValue =
      completedVotes > 0 ? Math.round(totalRevenue / completedVotes) : 0;

    // Projection revenus mensuels (basée sur 30 derniers jours)
    const projectedMonthlyRevenue = totalRevenue; // Si on a 30 jours de données

    return {
      totalRevenue,
      revenueByMethod,
      dailyRevenue,
      averageOrderValue,
      projectedMonthlyRevenue,
    };
  }

  /**
   * Statistiques d'engagement
   */
  private async getEngagementStats() {
    // Total vues et partages
    const engagement = await this.prisma.candidate.aggregate({
      _sum: {
        viewCount: true,
        shareCount: true,
      },
    });

    // Candidats les plus vus
    const mostViewedCandidates = await this.prisma.candidate.findMany({
      where: { status: CandidateStatus.APPROVED },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        country: true,
        viewCount: true,
        thumbnailUrl: true,
      },
    });

    // Candidats les plus partagés
    const mostSharedCandidates = await this.prisma.candidate.findMany({
      where: { status: CandidateStatus.APPROVED },
      orderBy: { shareCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        country: true,
        shareCount: true,
        thumbnailUrl: true,
      },
    });

    return {
      totalViews: engagement._sum.viewCount || 0,
      totalShares: engagement._sum.shareCount || 0,
      mostViewedCandidates,
      mostSharedCandidates,
    };
  }

  /**
   * Récupérer les données de série temporelle (pour graphiques)
   */
  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesData[]> {
    const data = await this.prisma.$queryRaw<
      {
        date: string;
        votes: bigint;
        revenue: bigint;
        candidates: bigint;
      }[]
    >`
      SELECT 
        DATE(v.created_at) as date,
        COUNT(v.id) as votes,
        SUM(v.amount) as revenue,
        COUNT(DISTINCT c.id) as candidates
      FROM votes v
      LEFT JOIN candidates c ON DATE(c.created_at) = DATE(v.created_at)
      WHERE v.payment_status = 'COMPLETED'
        AND v.created_at >= ${startDate}
        AND v.created_at <= ${endDate}
      GROUP BY DATE(v.created_at)
      ORDER BY date ASC
    `;

    return data.map((item) => ({
      date: item.date,
      votes: Number(item.votes),
      revenue: Number(item.revenue),
      candidates: Number(item.candidates),
    }));
  }

  /**
   * Récupérer les statistiques par période (aujourd'hui, cette semaine, ce mois)
   */
  async getStatsByPeriod(period: 'today' | 'week' | 'month') {
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    // Votes de la période
    const votesCount = await this.prisma.vote.count({
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Revenus de la période
    const revenueData = await this.prisma.vote.aggregate({
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    // Nouveaux candidats de la période
    const newCandidates = await this.prisma.candidate.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      period,
      startDate,
      endDate,
      votes: votesCount,
      revenue: revenueData._sum.amount || 0,
      newCandidates,
    };
  }

  /**
   * Récupérer les statistiques de conversion détaillées
   */
  async getConversionStats() {
    const totalVotes = await this.prisma.vote.count();
    
    const votesByStatus = await this.prisma.vote.groupBy({
      by: ['paymentStatus'],
      _count: { id: true },
    });

    const stats = votesByStatus.reduce(
      (acc, item) => {
        acc[item.paymentStatus.toLowerCase()] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const completed = stats.completed || 0;
    const pending = stats.pending || 0;
    const failed = stats.failed || 0;
    const cancelled = stats.cancelled || 0;

    return {
      total: totalVotes,
      completed,
      pending,
      failed,
      cancelled,
      conversionRate: totalVotes > 0 ? Math.round((completed / totalVotes) * 100) : 0,
      failureRate: totalVotes > 0 ? Math.round((failed / totalVotes) * 100) : 0,
      pendingRate: totalVotes > 0 ? Math.round((pending / totalVotes) * 100) : 0,
    };
  }

  /**
   * Récupérer les top votants
   */
  async getTopVoters(limit: number = 10) {
    const topVoters = await this.prisma.vote.groupBy({
      by: ['voterPhone'],
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        voterPhone: { not: null },
      },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    return topVoters.map((voter, index) => ({
      rank: index + 1,
      phone: voter.voterPhone,
      totalVotes: voter._count.id,
      totalSpent: voter._sum.amount || 0,
    }));
  }

  /**
   * Récupérer les statistiques d'IP blacklist
   */
  async getBlacklistStats() {
    const total = await this.prisma.ipBlacklist.count();
    
    const active = await this.prisma.ipBlacklist.count({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    const recent = await this.prisma.ipBlacklist.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        ipAddress: true,
        reason: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return {
      total,
      active,
      expired: total - active,
      recent,
    };
  }
}
