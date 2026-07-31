import { SetMetadata } from '@nestjs/common';
import { Role } from '../types/role';

/**
 * Marks a route (or controller) as accessible only to the listed roles.
 * Enforced by RolesGuard. Use alongside @UseGuards(JwtAuthGuard, RolesGuard).
 *
 * @Roles(Role.ADMIN_OFFICER, Role.SUPER_ADMIN)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
