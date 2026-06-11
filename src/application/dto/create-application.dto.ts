import { IsDateString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  jobId: string;

  @IsUUID()
  applicantId: string;

  @IsDateString()
  applicationDate: string;
}
