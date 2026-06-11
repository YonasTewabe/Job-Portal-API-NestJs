import { IsDateString, IsString, IsUUID } from 'class-validator';
import { IsFutureDate } from '../validators/is-future-date.validator';

export class CreateJobDto {
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

  @IsString()
  salary: string;

  @IsDateString()
  @IsFutureDate()
  deadline: string;

  @IsUUID()
  companyId: string;
}
