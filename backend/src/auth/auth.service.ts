import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/strategies/jwt.strategy';
import { LoginDto } from './dtos/login.dto';
import { ttlToSeconds } from '../common/utils/ttl';

/**
 * Auth application service. Coordinates credential validation and JWT issuance.
 * Depends on UsersService (repository access) and JwtService (token signing) —
 * both injected (DI per nestjs-oop-design-patterns).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates credentials and returns the user-safe record on success.
   * Throws UnauthorizedException on any failure (no user vs. wrong password
   * share the same message to avoid user-enumeration).
   */
  async validateCredentials(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  /** Issues a signed JWT for the given user. */
  issueAccessToken(user: { id: string; email: string; role: string }): string {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const ttl = this.configService.get<string>('JWT_ACCESS_TTL') ?? '8h';
    return this.jwtService.sign(payload, {
      expiresIn: ttlToSeconds(ttl),
    });
  }

  /** Full login flow: validate, touch lastLoginAt, return user-safe record + token. */
  async login(dto: LoginDto) {
    const user = await this.validateCredentials(dto);
    await this.usersService.touchLastLogin(user.id);
    const accessToken = this.issueAccessToken(user);
    const safe = await this.usersService.findPublicById(user.id);
    if (!safe) throw new NotFoundException('User not found after login');
    // Cast Prisma Role → local Role (identical string enum values, nominally different types).
    return { user: safe as any, accessToken };
  }
}
