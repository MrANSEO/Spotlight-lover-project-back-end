// ==============================================
// INTERFACES PAIEMENTS
// ==============================================

export interface InitPaymentParams {
  amount: number;
  currency: string;
  reference: string; // Notre transaction ID unique
  callbackUrl: string;
  webhookUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string; // URL de redirection pour le paiement
  providerReference?: string; // ID de la transaction chez le provider
  message?: string;
  error?: string;
  data?: any; // Données brutes du provider
}

export interface TransactionStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  providerReference: string;
  amount: number;
  currency: string;
  message?: string;
  data?: any;
}

export interface WebhookVerification {
  isValid: boolean;
  data?: any;
  error?: string;
}

// Interface abstraite pour tous les providers
export interface IPaymentProvider {
  // Initialiser un paiement
  initializePayment(params: InitPaymentParams): Promise<PaymentResponse>;

  // Vérifier la signature d'un webhook
  verifyWebhookSignature(payload: any, signature?: string, headers?: any): WebhookVerification;

  // Obtenir le statut d'une transaction
  getTransactionStatus(providerReference: string): Promise<TransactionStatus>;

  // Rembourser une transaction (optionnel)
  refundTransaction?(providerReference: string, amount?: number): Promise<PaymentResponse>;
}
