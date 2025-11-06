import { IsString, IsNumber, IsOptional, IsEmail, IsIn, Min } from 'class-validator';

export class InitPaymentDto {
  @IsString()
  @IsIn(['mtn', 'orange', 'stripe'])
  provider: string;

  @IsNumber()
  @Min(100)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'XOF';

  @IsString()
  reference: string;

  @IsString()
  callbackUrl: string;

  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
