import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { RecordPaymentJobDto } from './record-payment-job.dto';

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

  /** When provided, a draft job is created and linked to this payment */
  @IsOptional()
  @ValidateNested()
  @Type(() => RecordPaymentJobDto)
  job?: RecordPaymentJobDto;
}
