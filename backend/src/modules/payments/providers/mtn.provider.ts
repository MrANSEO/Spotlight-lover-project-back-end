import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentProvider,
  InitPaymentParams,
  PaymentResponse,
  TransactionStatus,
  WebhookVerification,
} from './payment.interface';

@Injectable()
export class MtnMomoProvider implements IPaymentProvider {
  private readonly logger = new Logger(MtnMomoProvider.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly config: any;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('payment.mtn');
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
      },
    });
  }

  /**
   * Obtenir un access token OAuth (avec cache)
   */
  private async getAccessToken(): Promise<string> {
    // Vérifier si le token est encore valide
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      // MTN MoMo utilise Basic Auth pour obtenir le token
      const response = await this.axiosInstance.post(
        '/collection/token/',
        {},
        {
          auth: {
            username: this.config.apiKey,
            password: this.config.apiSecret,
          },
        },
      );

      this.accessToken = response.data.access_token;
      // Token valide pendant 1 heure, on le cache pendant 55 minutes
      this.tokenExpiresAt = Date.now() + 55 * 60 * 1000;

      this.logger.log('✅ MTN MoMo access token obtenu');
      return this.accessToken;
    } catch (error) {
      this.logger.error('❌ Erreur obtention token MTN MoMo', error.response?.data);
      throw new Error('Impossible d\'obtenir le token MTN MoMo');
    }
  }

  /**
   * Initialiser un paiement MTN Mobile Money
   */
  async initializePayment(params: InitPaymentParams): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();
      const referenceId = uuidv4(); // ID unique pour MTN

      // Request to Pay - MTN MoMo Collection API
      const response = await this.axiosInstance.post(
        '/collection/v1_0/requesttopay',
        {
          amount: params.amount.toString(),
          currency: params.currency,
          externalId: params.reference, // Notre ID
          payer: {
            partyIdType: 'MSISDN',
            partyId: params.customerPhone, // Numéro de téléphone
          },
          payerMessage: params.description || 'Vote Spotlight Lover',
          payeeNote: `Vote - ${params.reference}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Reference-Id': referenceId, // ID unique MTN
            'X-Target-Environment': this.config.environment,
          },
        },
      );

      this.logger.log(`✅ Paiement MTN MoMo initialisé: ${referenceId}`);

      // MTN MoMo retourne 202 Accepted
      if (response.status === 202) {
        return {
          success: true,
          providerReference: referenceId,
          message: 'Paiement initié avec succès. Veuillez approuver sur votre téléphone.',
          data: response.data,
        };
      }

      return {
        success: false,
        error: 'Erreur lors de l\'initialisation du paiement',
      };
    } catch (error) {
      this.logger.error('❌ Erreur initialisation paiement MTN MoMo', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur MTN MoMo',
        data: error.response?.data,
      };
    }
  }

  /**
   * Obtenir le statut d'une transaction MTN MoMo
   */
  async getTransactionStatus(providerReference: string): Promise<TransactionStatus> {
    try {
      const token = await this.getAccessToken();

      const response = await this.axiosInstance.get(
        `/collection/v1_0/requesttopay/${providerReference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Target-Environment': this.config.environment,
          },
        },
      );

      const data = response.data;
      let status: TransactionStatus['status'] = 'pending';

      // Mapper les statuts MTN vers nos statuts
      switch (data.status) {
        case 'SUCCESSFUL':
          status = 'completed';
          break;
        case 'PENDING':
          status = 'processing';
          break;
        case 'FAILED':
          status = 'failed';
          break;
        default:
          status = 'pending';
      }

      return {
        status,
        providerReference,
        amount: parseFloat(data.amount),
        currency: data.currency,
        data,
      };
    } catch (error) {
      this.logger.error('❌ Erreur vérification statut MTN MoMo', error.response?.data);
      return {
        status: 'failed',
        providerReference,
        amount: 0,
        currency: 'XOF',
        message: error.response?.data?.message || 'Erreur vérification statut',
      };
    }
  }

  /**
   * Vérifier la signature d'un webhook MTN MoMo
   */
  verifyWebhookSignature(payload: any, signature?: string, headers?: any): WebhookVerification {
    try {
      // MTN MoMo n'utilise pas de signature de webhook standard
      // On doit vérifier que le payload contient les champs requis
      if (!payload || !payload.referenceId || !payload.status) {
        return {
          isValid: false,
          error: 'Payload webhook invalide',
        };
      }

      this.logger.log('✅ Webhook MTN MoMo valide');
      return {
        isValid: true,
        data: payload,
      };
    } catch (error) {
      this.logger.error('❌ Erreur vérification webhook MTN MoMo', error);
      return {
        isValid: false,
        error: 'Erreur vérification webhook',
      };
    }
  }

  /**
   * Rembourser une transaction (si supporté)
   */
  async refundTransaction(providerReference: string, amount?: number): Promise<PaymentResponse> {
    // MTN MoMo ne supporte pas les remboursements automatiques via API
    // Nécessite un processus manuel
    this.logger.warn('⚠️ Remboursement MTN MoMo non supporté automatiquement');
    return {
      success: false,
      error: 'Remboursement manuel requis pour MTN MoMo',
    };
  }
}
