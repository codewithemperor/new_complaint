import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../types/permission';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Fine-grained module authorization. Reads @Permissions() metadata and rejects
 * the caller unless they satisfy the requirement.
 *
 * Passes when ANY of:
 *   - no @Permissions() metadata is set (route has no module gate), OR
 *   - the caller is a Super Admin (isSuperAdmin === true), OR
 *   - the caller holds the ALL permission, OR
 *   - the caller holds at least one of the required permissions.
 *
 * Runs after RolesGuard (the coarse role gate). Non-admin roles are typically
 * denied by RolesGuard before this guard is meaningful; this guard's job is to
 * differentiate what an ADMIN can do based on their assigned module permissions.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (user.isSuperAdmin) return true;
    if (user.permissions?.includes(Permission.ALL)) return true;
    if (required.some((p) => user.permissions?.includes(p))) return true;

    throw new ForbiddenException('Insufficient permissions');
  }
}
