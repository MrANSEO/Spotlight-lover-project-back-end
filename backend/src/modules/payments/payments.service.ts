import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MtnMomoProvider } from './providers/mtn.provider';
import { OrangeMoneyProvider } from './providers/orange.provider';
import { StripeProvider } from './providers/stripe.provider';
import {
  IPaymentProvider,
  InitPaymentParams,
  PaymentResponse,
  TransactionStatus,
  WebhookVerification,
} from './providers/payment.interface';

export enum PaymentProviderType {
  MTN = 'mtn',
  ORANGE = 'orange',
  STRIPE = 'stripe',
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly mtnProvider: MtnMomoProvider,
    private readonly orangeProvider: OrangeMoneyProvider,
    private readonly stripeProvider: StripeProvider,
  ) {}

  /**
   * Obtenir le provider approprié selon le type
   */
  private getProvider(providerType: string): IPaymentProvider {
    switch (providerType.toLowerCase()) {
      case PaymentProviderType.MTN:
        return this.mtnProvider;
      case PaymentProviderType.ORANGE:
        return this.orangeProvider;
      case PaymentProviderType.STRIPE:
        return this.stripeProvider;
      default:
        throw new BadRequestException(`Provider de paiement non supporté: ${providerType}`);
    }
  }

  /**
   * Initialiser un paiement
   */
  async initializePayment(
    providerType: string,
    params: InitPaymentParams,
  ): Promise<PaymentResponse> {
    this.logger.log(`🔄 Initialisation paiement ${providerType}: ${params.reference}`);
    const provider = this.getProvider(providerType);
    return provider.initializePayment(params);
  }

  /**
   * Vérifier le statut d'une transaction
   */
  async getTransactionStatus(
    providerType: string,
    providerReference: string,
  ): Promise<TransactionStatus> {
    this.logger.log(`🔍 Vérification statut ${providerType}: ${providerReference}`);
    const provider = this.getProvider(providerType);
    return provider.getTransactionStatus(providerReference);
  }

  /**
   * Vérifier la signature d'un webhook
   */
  verifyWebhookSignature(
    providerType: string,
    payload: any,
    signature?: string,
    headers?: any,
  ): WebhookVerification {
    this.logger.log(`🔐 Vérification webhook ${providerType}`);
    const provider = this.getProvider(providerType);
    return provider.verifyWebhookSignature(payload, signature, headers);
  }

  /**
   * Rembourser une transaction
   */
  async refundTransaction(
    providerType: string,
    providerReference: string,
    amount?: number,
  ): Promise<PaymentResponse> {
    this.logger.log(`💰 Remboursement ${providerType}: ${providerReference}`);
    const provider = this.getProvider(providerType);
    
    if (!provider.refundTransaction) {
      throw new BadRequestException(`Remboursement non supporté pour ${providerType}`);
    }
    
    return provider.refundTransaction(providerReference, amount);
  }

  /**
   * Mapper PaymentMethod (Prisma enum) vers PaymentProviderType
   */
  mapPaymentMethodToProvider(paymentMethod: string): PaymentProviderType {
    switch (paymentMethod) {
      case 'MTN_MOBILE_MONEY':
        return PaymentProviderType.MTN;
      case 'ORANGE_MONEY':
        return PaymentProviderType.ORANGE;
      case 'CARD':
        return PaymentProviderType.STRIPE;
      default:
        throw new BadRequestException(`Méthode de paiement non supportée: ${paymentMethod}`);
    }
  }

  /**
   * Obtenir la liste des providers disponibles
   */
  getAvailableProviders(): string[] {
    return Object.values(PaymentProviderType);
  }
}
