import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'MODERATOR')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * ADMIN - Récupérer le dashboard complet
   * GET /analytics/dashboard
   */
  @Get('dashboard')
  async getDashboard() {
    const stats = await this.analyticsService.getDashboardStats();

    return {
      success: true,
      message: 'Statistiques du dashboard récupérées avec succès',
      data: stats,
    };
  }

  /**
   * ADMIN - Récupérer les statistiques par période
   * GET /analytics/period?type=today|week|month
   */
  @Get('period')
  async getStatsByPeriod(@Query('type') type: 'today' | 'week' | 'month') {
    const period = type || 'today';
    const stats = await this.analyticsService.getStatsByPeriod(period);

    return {
      success: true,
      message: `Statistiques de la période '${period}' récupérées avec succès`,
      data: stats,
    };
  }

  /**
   * ADMIN - Récupérer les données de série temporelle
   * GET /analytics/time-series?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  @Get('time-series')
  async getTimeSeries(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Par défaut: 30 derniers jours
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const data = await this.analyticsService.getTimeSeriesData(start, end);

    return {
      success: true,
      message: 'Données de série temporelle récupérées avec succès',
      data: {
        startDate: start,
        endDate: end,
        series: data,
      },
    };
  }

  /**
   * ADMIN - Récupérer les statistiques de conversion
   * GET /analytics/conversion
   */
  @Get('conversion')
  async getConversionStats() {
    const stats = await this.analyticsService.getConversionStats();

    return {
      success: true,
      message: 'Statistiques de conversion récupérées avec succès',
      data: stats,
    };
  }

  /**
   * ADMIN - Récupérer les top votants
   * GET /analytics/top-voters?limit=10
   */
  @Get('top-voters')
  async getTopVoters(@Query('limit') limit?: string) {
    const topVoters = await this.analyticsService.getTopVoters(
      limit ? parseInt(limit, 10) : 10,
    );

    return {
      success: true,
      message: 'Top votants récupérés avec succès',
      data: topVoters,
    };
  }

  /**
   * ADMIN - Récupérer les statistiques d'IP blacklist
   * GET /analytics/blacklist
   */
  @Get('blacklist')
  async getBlacklistStats() {
    const stats = await this.analyticsService.getBlacklistStats();

    return {
      success: true,
      message: 'Statistiques de blacklist récupérées avec succès',
      data: stats,
    };
  }

  /**
   * ADMIN - Exporter les données au format CSV
   * GET /analytics/export/csv?type=votes|candidates|transactions
   */
  @Get('export/csv')
  async exportCSV(
    @Query('type') type: 'votes' | 'candidates' | 'transactions',
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'votes':
        csvContent = await this.generateVotesCSV();
        filename = `votes-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'candidates':
        csvContent = await this.generateCandidatesCSV();
        filename = `candidates-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'transactions':
        csvContent = await this.generateTransactionsCSV();
        filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        throw new Error('Type d\'export invalide');
    }

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(Buffer.from(csvContent, 'utf-8'));
  }

  /**
   * Générer le CSV des votes
   */
  private async generateVotesCSV(): Promise<string> {
    // Note: Utiliser une bibliothèque comme 'papaparse' ou 'csv-writer' serait mieux
    // Pour simplifier, on génère manuellement le CSV
    
    const votes = await this.analyticsService['prisma'].vote.findMany({
      include: {
        candidate: {
          select: {
            name: true,
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limiter à 10k pour éviter la surcharge
    });

    let csv = 'ID,Candidat,Pays,Montant,Méthode,Statut,Téléphone,Email,Date\n';

    votes.forEach((vote) => {
      csv += `${vote.id},`;
      csv += `"${vote.candidate.name}",`;
      csv += `${vote.candidate.country},`;
      csv += `${vote.amount},`;
      csv += `${vote.paymentMethod},`;
      csv += `${vote.paymentStatus},`;
      csv += `${vote.voterPhone || ''},`;
      csv += `${vote.voterEmail || ''},`;
      csv += `${vote.createdAt.toISOString()}\n`;
    });

    return csv;
  }

  /**
   * Générer le CSV des candidats
   */
  private async generateCandidatesCSV(): Promise<string> {
    const candidates = await this.analyticsService['prisma'].candidate.findMany({
      orderBy: { totalVotes: 'desc' },
    });

    let csv =
      'ID,Nom,Âge,Pays,Ville,Statut,Total Votes,Total Revenus,Vues,Partages,Date Création\n';

    candidates.forEach((candidate) => {
      csv += `${candidate.id},`;
      csv += `"${candidate.name}",`;
      csv += `${candidate.age},`;
      csv += `${candidate.country},`;
      csv += `${candidate.city},`;
      csv += `${candidate.status},`;
      csv += `${candidate.totalVotes},`;
      csv += `${candidate.totalRevenue},`;
      csv += `${candidate.viewCount},`;
      csv += `${candidate.shareCount},`;
      csv += `${candidate.createdAt.toISOString()}\n`;
    });

    return csv;
  }

  /**
   * Générer le CSV des transactions
   */
  private async generateTransactionsCSV(): Promise<string> {
    const transactions =
      await this.analyticsService['prisma'].transaction.findMany({
        include: {
          vote: {
            include: {
              candidate: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { initiatedAt: 'desc' },
        take: 10000,
      });

    let csv =
      'ID,Candidat,Montant,Devise,Méthode,Provider,Référence Provider,Statut,Date\n';

    transactions.forEach((tx) => {
      csv += `${tx.id},`;
      csv += `"${tx.vote?.candidate?.name || 'N/A'}",`;
      csv += `${tx.amount},`;
      csv += `${tx.currency},`;
      csv += `${tx.paymentMethod},`;
      csv += `${tx.provider},`;
      csv += `${tx.providerReference},`;
      csv += `${tx.status},`;
      csv += `${tx.initiatedAt.toISOString()}\n`;
    });

    return csv;
  }
}
