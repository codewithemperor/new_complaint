import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TrackingTokenPayload {
  ticketId: string;
  citizenId: string;
}

/**
 * Signs and verifies citizen tracking tokens (magic-link auth).
 *
 * Citizens are guests — they have no User account. Each ticket gets a signed
 * JWT (APP_TOKEN_SECRET) embedded in the /track/:code?token=... email link.
 * The TrackingTokenGuard verifies it on public citizen endpoints.
 *
 * Tokens are long-lived (90 days) because citizens may check status weeks
 * after submitting.
 */
@Injectable()
export class TrackingTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  issue(payload: TrackingTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('APP_TOKEN_SECRET'),
      expiresIn: '90d',
    });
  }

  verify(token: string): TrackingTokenPayload | null {
    try {
      return this.jwtService.verify<TrackingTokenPayload>(token, {
        secret: this.configService.get<string>('APP_TOKEN_SECRET'),
      });
    } catch {
      return null;
    }
  }
}
