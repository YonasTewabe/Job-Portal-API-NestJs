import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEmail({}, { message: 'Provide a valid contact email' })
  contactEmail: string;

  @IsString()
  phone: string;

  /** The user account that will be the company_admin for this company.
   *  Superadmin provides email + password; the backend creates the user. */
  @IsString()
  adminName: string;

  @IsEmail({}, { message: 'Provide a valid admin email' })
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;
}
