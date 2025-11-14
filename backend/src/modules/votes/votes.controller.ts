import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto, QueryVotesDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  /**
   * PUBLIC - Créer un nouveau vote
   * POST /votes
   * 
   * Initialise un vote et le paiement associé
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createVoteDto: CreateVoteDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.votesService.create(
      createVoteDto,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: 'Vote créé avec succès. Veuillez compléter le paiement.',
      data: result,
    };
  }

  /**
   * ADMIN - Récupérer tous les votes avec filtres
   * GET /votes
   * 
   * Filtres disponibles: candidateId, paymentMethod, paymentStatus, phone, transactionRef, startDate, endDate
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MODERATOR')
  @Get()
  async findAll(@Query() query: QueryVotesDto) {
    const result = await this.votesService.findAll(query);

    return {
      success: true,
      message: 'Votes récupérés avec succès',
      ...result,
    };
  }

  /**
   * ADMIN - Récupérer les statistiques des votes
   * GET /votes/stats
   * 
   * Query param optionnel: candidateId (pour filtrer par candidat)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MODERATOR')
  @Get('stats')
  async getStats(@Query('candidateId') candidateId?: string) {
    const stats = await this.votesService.getStats(candidateId);

    return {
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: stats,
    };
  }

  /**
   * ADMIN - Récupérer les top votants
   * GET /votes/top-voters
   * 
   * Query param: limit (défaut: 20)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MODERATOR')
  @Get('top-voters')
  async getTopVoters(@Query('limit') limit?: string) {
    const voters = await this.votesService.getTopVoters(
      limit ? parseInt(limit, 10) : 20,
    );

    return {
      success: true,
      message: 'Top votants récupérés avec succès',
      data: voters,
    };
  }

  /**
   * PUBLIC - Récupérer un vote par son ID
   * GET /votes/:id
   */
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const vote = await this.votesService.findOne(id);

    return {
      success: true,
      message: 'Vote récupéré avec succès',
      data: vote,
    };
  }

  /**
   * PUBLIC - Vérifier le statut d'un paiement
   * GET /votes/:id/status
   * 
   * Interroge le provider de paiement pour obtenir le statut actuel
   */
  @Public()
  @Get(':id/status')
  async checkStatus(@Param('id') id: string) {
    const vote = await this.votesService.checkPaymentStatus(id);

    return {
      success: true,
      message: 'Statut vérifié avec succès',
      data: vote,
    };
  }
}
