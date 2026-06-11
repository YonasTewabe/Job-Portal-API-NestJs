import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ExperienceEntryDto {
  @IsString()
  title: string;

  @IsString()
  company: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
