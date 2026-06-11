import { IsDateString, IsString, IsUUID } from 'class-validator';

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
  deadline: string;

  /** The company this job belongs to */
  @IsUUID()
  companyId: string;
}
