import { IsDateString, IsOptional, IsString } from 'class-validator';
import { IsFutureDate } from '../../jobs/validators/is-future-date.validator';

export class RecordPaymentJobDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsString()
  location: string;

  @IsString()
  description: string;

  @IsString()
  requirement: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsDateString()
  @IsFutureDate()
  deadline: string;
}
