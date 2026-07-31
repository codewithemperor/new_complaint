import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TrackingTokenPayload } from '../../tickets/tracking-token.service';

/**
 * Extracts the verified tracking payload attached by TrackingTokenGuard
 * onto request.tracking. Contains { ticketId, citizenId }.
 */
export const TrackingPayload = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TrackingTokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.tracking as TrackingTokenPayload;
  },
);
