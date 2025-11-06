import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  IPaymentProvider,
  InitPaymentParams,
  PaymentResponse,
  TransactionStatus,
  WebhookVerification,
} from './payment.interface';

@Injectable()
export class OrangeMoneyProvider implements IPaymentProvider {
  private readonly logger = new Logger(OrangeMoneyProvider.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly config: any;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('payment.orange');
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Obtenir un access token OAuth2
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`,
      ).toString('base64');

      const response = await axios.post(
        'https://api.orange.com/oauth/v3/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      // Token valide selon expires_in, on cache 5 minutes avant expiration
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiresAt = Date.now() + (expiresIn - 300) * 1000;

      this.logger.log('✅ Orange Money access token obtenu');
      return this.accessToken;
    } catch (error) {
      this.logger.error('❌ Erreur obtention token Orange Money', error.response?.data);
      throw new Error('Impossible d\'obtenir le token Orange Money');
    }
  }

  /**
   * Initialiser un paiement Orange Money
   */
  async initializePayment(params: InitPaymentParams): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();

      // Orange Money Web Payment API
      const response = await this.axiosInstance.post(
        '/webpayment/v1/transactionRequests',
        {
          merchant_key: this.config.merchantKey,
          currency: params.currency,
          order_id: params.reference,
          amount: params.amount,
          return_url: params.callbackUrl,
          cancel_url: params.callbackUrl,
          notif_url: params.webhookUrl || params.callbackUrl,
          lang: 'fr',
          reference: params.description || `Vote Spotlight Lover - ${params.reference}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      this.logger.log(`✅ Paiement Orange Money initialisé: ${response.data.payment_token}`);

      // Orange Money retourne un payment_token et une URL de paiement
      if (response.data.payment_token) {
        const paymentUrl = `${this.config.baseUrl}/webpayment/v1/paymentUrl/${response.data.payment_token}`;

        return {
          success: true,
          paymentUrl,
          providerReference: response.data.payment_token,
          message: 'Paiement Orange Money initié avec succès',
          data: response.data,
        };
      }

      return {
        success: false,
        error: 'Erreur lors de l\'initialisation du paiement',
      };
    } catch (error) {
      this.logger.error('❌ Erreur initialisation paiement Orange Money', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur Orange Money',
        data: error.response?.data,
      };
    }
  }

  /**
   * Obtenir le statut d'une transaction Orange Money
   */
  async getTransactionStatus(providerReference: string): Promise<TransactionStatus> {
    try {
      const token = await this.getAccessToken();

      const response = await this.axiosInstance.get(
        `/webpayment/v1/transactionRequests/${providerReference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;
      let status: TransactionStatus['status'] = 'pending';

      // Mapper les statuts Orange vers nos statuts
      switch (data.status) {
        case 'SUCCESS':
        case 'SUCCESSFUL':
          status = 'completed';
          break;
        case 'PENDING':
        case 'INITIATED':
          status = 'processing';
          break;
        case 'FAILED':
        case 'EXPIRED':
          status = 'failed';
          break;
        case 'CANCELLED':
          status = 'cancelled';
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
      this.logger.error('❌ Erreur vérification statut Orange Money', error.response?.data);
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
   * Vérifier la signature d'un webhook Orange Money
   */
  verifyWebhookSignature(payload: any, signature?: string, headers?: any): WebhookVerification {
    try {
      // Orange Money envoie une signature HMAC-SHA256
      if (!signature || !this.config.merchantKey) {
        this.logger.warn('⚠️ Pas de signature pour webhook Orange Money');
        return {
          isValid: false,
          error: 'Signature manquante',
        };
      }

      // Calculer la signature attendue
      const expectedSignature = crypto
        .createHmac('sha256', this.config.merchantKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      const isValid = signature === expectedSignature;

      if (!isValid) {
        this.logger.error('❌ Signature webhook Orange Money invalide');
        return {
          isValid: false,
          error: 'Signature invalide',
        };
      }

      this.logger.log('✅ Webhook Orange Money valide');
      return {
        isValid: true,
        data: payload,
      };
    } catch (error) {
      this.logger.error('❌ Erreur vérification webhook Orange Money', error);
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
    // Orange Money supporte les remboursements via API
    try {
      const token = await this.getAccessToken();

      const response = await this.axiosInstance.post(
        `/webpayment/v1/transactionRequests/${providerReference}/refund`,
        {
          amount: amount || undefined, // Remboursement partiel ou total
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      this.logger.log(`✅ Remboursement Orange Money effectué: ${providerReference}`);

      return {
        success: true,
        message: 'Remboursement effectué avec succès',
        data: response.data,
      };
    } catch (error) {
      this.logger.error('❌ Erreur remboursement Orange Money', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur remboursement',
        data: error.response?.data,
      };
    }
  }
}
