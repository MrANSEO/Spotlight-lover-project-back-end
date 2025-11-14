import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

/**
 * DTO pour le webhook Stripe
 * Format basé sur la documentation Stripe API
 */
export class StripeWebhookDto {
  /**
   * ID unique de l'événement Stripe
   */
  @IsString()
  @IsNotEmpty()
  id: string;

  /**
   * Type d'événement
   * Ex: checkout.session.completed, payment_intent.succeeded
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * Données de l'événement
   */
  @IsObject()
  @IsNotEmpty()
  data: {
    object: any;
  };

  /**
   * Date de création de l'événement (timestamp)
   */
  @IsNotEmpty()
  created: number;

  /**
   * Indicateur de mode live/test
   */
  @IsOptional()
  livemode?: boolean;
}
