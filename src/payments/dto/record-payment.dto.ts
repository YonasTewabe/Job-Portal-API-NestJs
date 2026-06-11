import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordPaymentDto {
  @IsString()
  txRef: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  jobTitle: string;

  @IsString()
  payerName: string;

  @IsString()
  payerEmail: string;

  @IsOptional()
  @IsString()
  payerPhone?: string;
}
