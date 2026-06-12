import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateApplicantProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  profileName?: string;
}
