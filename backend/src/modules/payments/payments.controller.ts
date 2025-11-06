import { Controller, Get, Post, Body, Param, Query, Logger, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitPaymentDto } from './dto/init-payment.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Test endpoint - Liste des providers disponibles
   */
  @Get('providers')
  getProviders() {
    return {
      success: true,
      providers: this.paymentsService.getAvailableProviders(),
    };
  }

  /**
   * Initialiser un paiement (utilisé par le module Votes)
   * Ce endpoint est principalement pour les tests
   */
  @Post('init')
  async initializePayment(@Body() dto: InitPaymentDto) {
    try {
      const result = await this.paymentsService.initializePayment(dto.provider, {
        amount: dto.amount,
        currency: dto.currency || 'XOF',
        reference: dto.reference,
        callbackUrl: dto.callbackUrl,
        webhookUrl: dto.webhookUrl,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        customerName: dto.customerName,
        description: dto.description,
      });

      return {
        success: result.success,
        data: result,
      };
    } catch (error) {
      this.logger.error('❌ Erreur initialisation paiement', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  @Get('status/:provider/:reference')
  async getTransactionStatus(
    @Param('provider') provider: string,
    @Param('reference') reference: string,
  ) {
    try {
      const status = await this.paymentsService.getTransactionStatus(provider, reference);
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error('❌ Erreur vérification statut', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Endpoint de remboursement (admin uniquement - à protéger)
   */
  @Post('refund/:provider/:reference')
  async refundTransaction(
    @Param('provider') provider: string,
    @Param('reference') reference: string,
    @Body('amount') amount?: number,
  ) {
    try {
      const result = await this.paymentsService.refundTransaction(provider, reference, amount);
      return {
        success: result.success,
        data: result,
      };
    } catch (error) {
      this.logger.error('❌ Erreur remboursement', error);
      throw new BadRequestException(error.message);
    }
  }
}
