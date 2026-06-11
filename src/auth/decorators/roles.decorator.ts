import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
/** Restrict a route to specific roles. Usage: @Roles('superadmin', 'company_admin') */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
