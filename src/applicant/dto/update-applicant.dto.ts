import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateApplicantDto {
  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cv?: string;

  @IsOptional()
  @IsBoolean()
  profileCompleted?: boolean;
}
