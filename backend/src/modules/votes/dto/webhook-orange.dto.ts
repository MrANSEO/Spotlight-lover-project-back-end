import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

/**
 * DTO pour le webhook Orange Money
 * Format basé sur la documentation Orange Money API
 */
export class OrangeWebhookDto {
  /**
   * ID de la transaction Orange
   */
  @IsString()
  @IsNotEmpty()
  pay_token: string;

  /**
   * ID de la commande (notre référence)
   */
  @IsString()
  @IsNotEmpty()
  order_id: string;

  /**
   * Montant de la transaction
   */
  @IsNumber()
  amount: number;

  /**
   * Statut de la transaction
   * SUCCESS, FAILED, PENDING, EXPIRED
   */
  @IsString()
  @IsNotEmpty()
  status: string;

  /**
   * Référence de la transaction Orange
   */
  @IsOptional()
  @IsString()
  txnid?: string;

  /**
   * Message d'erreur en cas d'échec
   */
  @IsOptional()
  @IsString()
  message?: string;

  /**
   * Numéro MSISDN du payeur
   */
  @IsOptional()
  @IsString()
  customer_msisdn?: string;
}
