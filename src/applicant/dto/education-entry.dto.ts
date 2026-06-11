import { IsDateString, IsOptional, IsString } from 'class-validator';

export class EducationEntryDto {
  @IsString()
  degree: string;

  @IsString()
  university: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
