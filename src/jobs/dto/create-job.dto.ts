import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { IsFutureDate } from '../validators/is-future-date.validator';

export const JOB_STATUSES = ['draft', 'published'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

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

  @IsOptional()
  @IsString()
  salary?: string;

  @IsDateString()
  @IsFutureDate()
  deadline: string;

  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsIn(JOB_STATUSES)
  status?: JobStatus;
}
