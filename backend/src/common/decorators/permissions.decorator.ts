import { SetMetadata } from '@nestjs/common';
import { Permission } from '../types/permission';

/**
 * Marks a route (or controller) as requiring one of the listed module
 * permissions. Enforced by PermissionsGuard (registered globally).
 *
 * A route guarded by @Permissions(...) is accessible when the caller:
 *   - is a Super Admin (isSuperAdmin === true), OR
 *   - holds the ALL permission, OR
 *   - holds at least one of the listed permissions.
 *
 * Use alongside @Roles(...). RolesGuard still runs first to enforce the coarse
 * role gate; PermissionsGuard layers the fine-grained module check on top.
 *
 * @Permissions(Permission.INTAKE, Permission.SCHEDULE)
 */
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
