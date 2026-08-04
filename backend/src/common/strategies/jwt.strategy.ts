import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../types/authenticated-user';
import { Role } from '../types/role';
import { Permission } from '../types/permission';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * JWT strategy. Reads the token from the httpOnly cookie first, falling back to
 * the Authorization: Bearer header. On each request it loads the user from the
 * DB (cheap; hits users.email unique index) so deactivated users are rejected
 * even with a still-valid token, and so permission/role changes take effect on
 * the next request without re-issuing the token.
 *
 * The secret is read from process.env directly in super() because parameter
 * properties are assigned AFTER super() runs — so ConfigService isn't yet on
 * `this` when the Passport base constructor needs the options.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any): string | null => req?.cookies?.['kwmoc_token'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return {
      id: user.id,
      email: user.email,
      // Cast: Prisma-generated Role enum → local Role enum (identical string values).
      role: user.role as unknown as Role,
      fullName: user.fullName,
      departmentId: user.departmentId,
      isSuperAdmin: user.isSuperAdmin,
      permissions: user.permissions.map((p) => p.permission as unknown as Permission),
    };
  }
}
