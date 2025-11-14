import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsIn,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

/**
 * DTO pour la requête de votes avec filtres, tri et pagination
 */
export class QueryVotesDto {
  /**
   * Filtrer par ID de candidat
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @IsOptional()
  @IsUUID()
  candidateId?: string;

  /**
   * Filtrer par méthode de paiement
   * @example "MTN_MONEY"
   */
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  /**
   * Filtrer par statut de paiement
   * @example "COMPLETED"
   */
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  /**
   * Filtrer par numéro de téléphone
   * @example "+237677889900"
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Rechercher par référence de transaction
   * @example "TXN-20240114-ABC123"
   */
  @IsOptional()
  @IsString()
  transactionRef?: string;

  /**
   * Date de début (ISO 8601)
   * @example "2024-01-01T00:00:00Z"
   */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * Date de fin (ISO 8601)
   * @example "2024-01-31T23:59:59Z"
   */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Champ de tri
   * @example "createdAt"
   */
  @IsOptional()
  @IsIn(['createdAt', 'amount', 'paymentStatus'])
  sortBy?: string = 'createdAt';

  /**
   * Ordre de tri
   * @example "desc"
   */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  /**
   * Numéro de page (commence à 1)
   * @example 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Nombre d'éléments par page
   * @example 20
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
