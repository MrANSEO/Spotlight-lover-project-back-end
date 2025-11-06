import { registerAs } from '@nestjs/config';

export const paymentConfig = registerAs('payment', () => ({
  // MTN Mobile Money
  mtn: {
    apiKey: process.env.MTN_MOMO_API_KEY,
    apiSecret: process.env.MTN_MOMO_API_SECRET,
    subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY,
    callbackUrl: process.env.MTN_MOMO_CALLBACK_URL,
    environment: process.env.MTN_MOMO_ENVIRONMENT || 'sandbox',
    baseUrl:
      process.env.MTN_MOMO_ENVIRONMENT === 'production'
        ? 'https://proxy.momoapi.mtn.com'
        : 'https://sandbox.momoapi.mtn.com',
  },

  // Orange Money
  orange: {
    clientId: process.env.ORANGE_MONEY_CLIENT_ID,
    clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET,
    merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY,
    callbackUrl: process.env.ORANGE_MONEY_CALLBACK_URL,
    environment: process.env.ORANGE_MONEY_ENVIRONMENT || 'sandbox',
    baseUrl:
      process.env.ORANGE_MONEY_ENVIRONMENT === 'production'
        ? 'https://api.orange.com/orange-money-webpay/dev/v1'
        : 'https://api.orange.com/orange-money-webpay/dev/v1',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.STRIPE_CURRENCY || 'XOF',
  },
}));
