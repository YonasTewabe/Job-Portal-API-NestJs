import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsIn(['job_application', 'company_support', 'user_support'])
  type: 'job_application' | 'company_support' | 'user_support';

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
