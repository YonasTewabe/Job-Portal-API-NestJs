import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @IsOptional()
  @IsBoolean()
  interviewHasTime?: boolean;

  @IsOptional()
  @IsString()
  interviewLocation?: string;
}
