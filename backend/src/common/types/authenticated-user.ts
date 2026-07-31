import { Role } from './role';

/**
 * The authenticated principal attached to request.user by JwtAuthGuard.
 * Deliberately small — only what guards and handlers need.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  departmentId?: string | null;
}
