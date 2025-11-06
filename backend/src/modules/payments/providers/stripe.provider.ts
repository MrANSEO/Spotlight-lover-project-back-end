import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  IPaymentProvider,
  InitPaymentParams,
  PaymentResponse,
  TransactionStatus,
  WebhookVerification,
} from './payment.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private readonly stripe: Stripe;
  private readonly config: any;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('payment.stripe');
    this.stripe = new Stripe(this.config.secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Initialiser un paiement Stripe (Checkout Session)
   */
  async initializePayment(params: InitPaymentParams): Promise<PaymentResponse> {
    try {
      // Créer une Checkout Session Stripe
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(), // 'xof'
              product_data: {
                name: 'Vote Spotlight Lover',
                description: params.description || `Vote pour candidat - ${params.reference}`,
                images: ['https://your-domain.com/logo.png'], // Logo de votre plateforme
              },
              unit_amount: params.amount, // Stripe utilise les centimes, mais XOF n'a pas de subdivisions
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${params.callbackUrl}?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${params.callbackUrl}?status=cancelled`,
        client_reference_id: params.reference, // Notre ID de transaction
        customer_email: params.customerEmail,
        metadata: {
          reference: params.reference,
          customerPhone: params.customerPhone || '',
          customerName: params.customerName || '',
        },
      });

      this.logger.log(`✅ Session Stripe créée: ${session.id}`);

      return {
        success: true,
        paymentUrl: session.url,
        providerReference: session.id,
        message: 'Session de paiement Stripe créée',
        data: session,
      };
    } catch (error) {
      this.logger.error('❌ Erreur création session Stripe', error.message);
      return {
        success: false,
        error: error.message || 'Erreur Stripe',
        data: error,
      };
    }
  }

  /**
   * Obtenir le statut d'une transaction Stripe
   */
  async getTransactionStatus(providerReference: string): Promise<TransactionStatus> {
    try {
      // Récupérer la session Stripe
      const session = await this.stripe.checkout.sessions.retrieve(providerReference);

      let status: TransactionStatus['status'] = 'pending';

      // Mapper les statuts Stripe vers nos statuts
      switch (session.payment_status) {
        case 'paid':
          status = 'completed';
          break;
        case 'unpaid':
          status = 'pending';
          break;
        case 'no_payment_required':
          status = 'completed';
          break;
        default:
          status = 'pending';
      }

      // Si la session est expirée
      if (session.status === 'expired') {
        status = 'failed';
      }

      return {
        status,
        providerReference,
        amount: session.amount_total || 0,
        currency: session.currency?.toUpperCase() || 'XOF',
        data: session,
      };
    } catch (error) {
      this.logger.error('❌ Erreur vérification statut Stripe', error.message);
      return {
        status: 'failed',
        providerReference,
        amount: 0,
        currency: 'XOF',
        message: error.message || 'Erreur vérification statut',
      };
    }
  }

  /**
   * Vérifier la signature d'un webhook Stripe
   */
  verifyWebhookSignature(payload: any, signature?: string, headers?: any): WebhookVerification {
    try {
      if (!signature || !this.config.webhookSecret) {
        this.logger.warn('⚠️ Pas de signature pour webhook Stripe');
        return {
          isValid: false,
          error: 'Signature manquante',
        };
      }

      // Stripe envoie le payload en raw string
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

      // Vérifier la signature avec la bibliothèque Stripe
      const event = this.stripe.webhooks.constructEvent(
        payloadString,
        signature,
        this.config.webhookSecret,
      );

      this.logger.log(`✅ Webhook Stripe valide: ${event.type}`);
      return {
        isValid: true,
        data: event,
      };
    } catch (error) {
      this.logger.error('❌ Erreur vérification webhook Stripe', error.message);
      return {
        isValid: false,
        error: error.message || 'Signature invalide',
      };
    }
  }

  /**
   * Rembourser une transaction Stripe
   */
  async refundTransaction(providerReference: string, amount?: number): Promise<PaymentResponse> {
    try {
      // Récupérer la session pour obtenir le payment_intent
      const session = await this.stripe.checkout.sessions.retrieve(providerReference);

      if (!session.payment_intent) {
        return {
          success: false,
          error: 'Aucun payment_intent trouvé pour cette session',
        };
      }

      // Créer le remboursement
      const refund = await this.stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        amount: amount || undefined, // Remboursement partiel ou total
      });

      this.logger.log(`✅ Remboursement Stripe effectué: ${refund.id}`);

      return {
        success: true,
        providerReference: refund.id,
        message: 'Remboursement effectué avec succès',
        data: refund,
      };
    } catch (error) {
      this.logger.error('❌ Erreur remboursement Stripe', error.message);
      return {
        success: false,
        error: error.message || 'Erreur remboursement',
        data: error,
      };
    }
  }

  /**
   * Obtenir les détails d'un Payment Intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error('❌ Erreur récupération Payment Intent', error.message);
      throw error;
    }
  }
}
