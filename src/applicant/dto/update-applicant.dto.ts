import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EducationEntryDto } from './education-entry.dto';
import { ExperienceEntryDto } from './experience-entry.dto';

export class UpdateApplicantDto {
  @IsOptional()
  @IsString()
  profileName?: string;

  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsString()
  userPhone?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EducationEntryDto)
  educations?: EducationEntryDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experiences?: ExperienceEntryDto[];

  @IsOptional()
  @IsString()
  cv?: string;

  @IsOptional()
  @IsBoolean()
  profileCompleted?: boolean;
}
