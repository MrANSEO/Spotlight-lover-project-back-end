import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { PaymentsService } from '../payments/payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { MtnWebhookDto, OrangeWebhookDto, StripeWebhookDto } from './dto';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly votesService: VotesService,
    private readonly paymentsService: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Webhook MTN Mobile Money
   * POST /webhooks/mtn
   */
  @Public()
  @Post('mtn')
  @HttpCode(HttpStatus.OK)
  async handleMtnWebhook(
    @Body() webhookDto: MtnWebhookDto,
    @Headers() headers: any,
    @Req() req: any,
  ) {
    this.logger.log('Webhook MTN reçu', JSON.stringify(webhookDto));

    try {
      // 1. Vérifier la signature du webhook
      const verification = this.paymentsService.verifyWebhookSignature(
        PaymentMethod.MTN_MOBILE_MONEY,
        webhookDto,
        undefined,
        headers,
      );

      if (!verification.isValid) {
        this.logger.warn('Signature MTN invalide');
        throw new BadRequestException('Signature invalide');
      }

      // 2. Logger le webhook
      await this.logWebhook(
        'MTN',
        webhookDto.referenceId,
        webhookDto,
        req.ip,
      );

      // 3. Déterminer le statut du paiement
      let paymentStatus: PaymentStatus;
      switch (webhookDto.status?.toUpperCase()) {
        case 'SUCCESSFUL':
          paymentStatus = PaymentStatus.COMPLETED;
          break;
        case 'FAILED':
          paymentStatus = PaymentStatus.FAILED;
          break;
        case 'PENDING':
          paymentStatus = PaymentStatus.PENDING;
          break;
        default:
          paymentStatus = PaymentStatus.FAILED;
      }

      // 4. Confirmer le paiement
      await this.votesService.confirmPayment(
        webhookDto.referenceId,
        paymentStatus,
        webhookDto,
      );

      return {
        success: true,
        message: 'Webhook MTN traité avec succès',
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement du webhook MTN: ${error.message}`,
        error.stack,
      );

      // Logger l'erreur
      await this.logWebhook(
        'MTN',
        webhookDto.referenceId,
        { ...webhookDto, error: error.message },
        req.ip,
      );

      // Retourner OK quand même pour éviter les retry inutiles
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Webhook Orange Money
   * POST /webhooks/orange
   */
  @Public()
  @Post('orange')
  @HttpCode(HttpStatus.OK)
  async handleOrangeWebhook(
    @Body() webhookDto: OrangeWebhookDto,
    @Headers() headers: any,
    @Req() req: any,
  ) {
    this.logger.log('Webhook Orange reçu', JSON.stringify(webhookDto));

    try {
      // 1. Vérifier la signature du webhook
      const verification = this.paymentsService.verifyWebhookSignature(
        PaymentMethod.ORANGE_MONEY,
        webhookDto,
        undefined,
        headers,
      );

      if (!verification.isValid) {
        this.logger.warn('Signature Orange invalide');
        throw new BadRequestException('Signature invalide');
      }

      // 2. Logger le webhook
      await this.logWebhook(
        'ORANGE',
        webhookDto.pay_token,
        webhookDto,
        req.ip,
      );

      // 3. Déterminer le statut du paiement
      let paymentStatus: PaymentStatus;
      switch (webhookDto.status?.toUpperCase()) {
        case 'SUCCESS':
          paymentStatus = PaymentStatus.COMPLETED;
          break;
        case 'FAILED':
          paymentStatus = PaymentStatus.FAILED;
          break;
        case 'PENDING':
          paymentStatus = PaymentStatus.PENDING;
          break;
        case 'EXPIRED':
          paymentStatus = PaymentStatus.CANCELLED; // Pas de EXPIRED dans l'enum, utilisons CANCELLED
          break;
        default:
          paymentStatus = PaymentStatus.FAILED;
      }

      // 4. Confirmer le paiement
      await this.votesService.confirmPayment(
        webhookDto.pay_token,
        paymentStatus,
        webhookDto,
      );

      return {
        success: true,
        message: 'Webhook Orange traité avec succès',
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement du webhook Orange: ${error.message}`,
        error.stack,
      );

      // Logger l'erreur
      await this.logWebhook(
        'ORANGE',
        webhookDto.pay_token,
        { ...webhookDto, error: error.message },
        req.ip,
      );

      // Retourner OK quand même pour éviter les retry inutiles
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Webhook Stripe
   * POST /webhooks/stripe
   */
  @Public()
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() webhookDto: StripeWebhookDto,
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    this.logger.log(`Webhook Stripe reçu: ${webhookDto.type}`);

    try {
      // 1. Vérifier la signature du webhook
      const verification = this.paymentsService.verifyWebhookSignature(
        PaymentMethod.CARD, // CARD pour Stripe
        req.rawBody || req.body,
        signature,
      );

      if (!verification.isValid) {
        this.logger.warn('Signature Stripe invalide');
        throw new BadRequestException('Signature invalide');
      }

      // 2. Logger le webhook
      await this.logWebhook('STRIPE', webhookDto.id, webhookDto, req.ip);

      // 3. Traiter selon le type d'événement
      switch (webhookDto.type) {
        case 'checkout.session.completed':
          await this.handleStripeCheckoutCompleted(webhookDto.data.object);
          break;

        case 'payment_intent.succeeded':
          await this.handleStripePaymentSucceeded(webhookDto.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(webhookDto.data.object);
          break;

        default:
          this.logger.log(`Événement Stripe non traité: ${webhookDto.type}`);
      }

      return {
        success: true,
        message: 'Webhook Stripe traité avec succès',
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement du webhook Stripe: ${error.message}`,
        error.stack,
      );

      // Logger l'erreur
      await this.logWebhook(
        'STRIPE',
        webhookDto.id,
        { ...webhookDto, error: error.message },
        req.ip,
      );

      // Retourner OK quand même pour éviter les retry inutiles
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Traiter une session Stripe complétée
   */
  private async handleStripeCheckoutCompleted(session: any) {
    const providerReference = session.id;
    const metadata = session.metadata;

    this.logger.log(
      `Session Stripe complétée: ${providerReference}`,
      JSON.stringify(metadata),
    );

    if (metadata?.transactionRef) {
      await this.votesService.confirmPayment(
        metadata.transactionRef,
        PaymentStatus.COMPLETED,
        session,
      );
    }
  }

  /**
   * Traiter un paiement Stripe réussi
   */
  private async handleStripePaymentSucceeded(paymentIntent: any) {
    const providerReference = paymentIntent.id;
    const metadata = paymentIntent.metadata;

    this.logger.log(`Paiement Stripe réussi: ${providerReference}`);

    if (metadata?.transactionRef) {
      await this.votesService.confirmPayment(
        metadata.transactionRef,
        PaymentStatus.COMPLETED,
        paymentIntent,
      );
    }
  }

  /**
   * Traiter un paiement Stripe échoué
   */
  private async handleStripePaymentFailed(paymentIntent: any) {
    const providerReference = paymentIntent.id;
    const metadata = paymentIntent.metadata;

    this.logger.log(`Paiement Stripe échoué: ${providerReference}`);

    if (metadata?.transactionRef) {
      await this.votesService.confirmPayment(
        metadata.transactionRef,
        PaymentStatus.FAILED,
        paymentIntent,
      );
    }
  }

  /**
   * Logger les webhooks dans la base de données
   */
  private async logWebhook(
    provider: string,
    reference: string,
    payload: any,
    ipAddress?: string,
  ) {
    try {
      await this.prisma.webhookLog.create({
        data: {
          provider,
          event: payload.type || payload.status || 'unknown',
          payload,
          ipAddress: ipAddress || 'unknown',
        },
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors du logging du webhook: ${error.message}`,
      );
    }
  }
}
