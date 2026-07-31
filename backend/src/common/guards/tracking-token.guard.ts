import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TrackingTokenService } from '../../tickets/tracking-token.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Validates citizen identity for public citizen-facing endpoints via either:
 *
 * 1. **Passcode** (`?passcode=123456`) — looks up the ticket by the `:code`
 *    route param, verifies the 6-digit passcode, extracts citizenId.
 *    This is the preferred path (simple, mobile-friendly).
 *
 * 2. **JWT token** (`?token=eyJ...`) — legacy magic-link auth. Verifies the
 *    signed token and extracts { ticketId, citizenId }. Kept for backward
 *    compatibility with emails already sent.
 *
 * Attaches { ticketId, citizenId } to `request.tracking`.
 */
@Injectable()
export class TrackingTokenGuard implements CanActivate {
  constructor(
    private readonly trackingTokenService: TrackingTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.query.token as string | undefined;
    const passcode = request.query.passcode as string | undefined;

    // Path 1: passcode-based auth (preferred).
    if (passcode) {
      const ticketCode = request.params.code as string | undefined;
      if (!ticketCode) {
        throw new UnauthorizedException('Ticket code is required');
      }

      const ticket = await this.prisma.ticket.findUnique({
        where: { ticketCode },
        select: { id: true, citizenId: true, trackingPasscode: true },
      });

      if (!ticket || !ticket.trackingPasscode || ticket.trackingPasscode !== passcode) {
        throw new UnauthorizedException('Invalid ticket code or passcode');
      }

      request.tracking = { ticketId: ticket.id, citizenId: ticket.citizenId };
      return true;
    }

    // Path 2: JWT token (legacy backward-compat).
    if (token) {
      const payload = this.trackingTokenService.verify(token);
      if (!payload) {
        throw new UnauthorizedException('Invalid or expired tracking token');
      }
      request.tracking = payload;
      return true;
    }

    throw new UnauthorizedException(
      'A tracking passcode or token is required to view this complaint',
    );
  }
}
