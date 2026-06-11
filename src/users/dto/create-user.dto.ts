import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsIn(['superadmin', 'company_admin', 'user'] as UserRole[], {
    message: 'Role must be superadmin, company_admin, or user',
  })
  role: UserRole;
}
