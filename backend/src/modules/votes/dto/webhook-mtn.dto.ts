import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

/**
 * DTO pour le webhook MTN Mobile Money
 * Format basé sur la documentation MTN MoMo API
 */
export class MtnWebhookDto {
  /**
   * ID de référence de la transaction
   */
  @IsString()
  @IsNotEmpty()
  referenceId: string;

  /**
   * ID externe de la transaction (notre référence)
   */
  @IsString()
  @IsNotEmpty()
  externalId: string;

  /**
   * Montant de la transaction
   */
  @IsNumber()
  amount: number;

  /**
   * Devise (XAF, XOF, etc.)
   */
  @IsString()
  @IsNotEmpty()
  currency: string;

  /**
   * Statut de la transaction
   * SUCCESSFUL, FAILED, PENDING
   */
  @IsString()
  @IsNotEmpty()
  status: string;

  /**
   * Raison en cas d'échec (optionnel)
   */
  @IsOptional()
  @IsString()
  reason?: string;

  /**
   * Informations sur le payeur
   */
  @IsOptional()
  payer?: {
    partyIdType: string;
    partyId: string;
  };
}
