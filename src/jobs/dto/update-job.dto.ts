import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { CreateJobDto, JOB_STATUSES, JobStatus } from './create-job.dto';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsIn(JOB_STATUSES)
  status?: JobStatus;
}
