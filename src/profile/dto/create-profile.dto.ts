import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  fullname?: string;

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
  userPhone?: string;

  @IsOptional()
  @IsString()
  cv?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsOptional()
  @IsIn(['user', 'hr'], { message: 'Role must be either user or hr' })
  role?: string;

  @IsOptional()
  @IsString()
  companyname?: string;

  @IsOptional()
  @IsString()
  companydescription?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid contact email' })
  contactemail?: string;

  @IsOptional()
  @IsString()
  companyPhone?: string;

  @IsOptional()
  @IsBoolean()
  userdataCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  hrdataCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  hrStatus?: boolean;
}
