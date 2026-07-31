import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';

/**
 * JWT auth guard. Reads the token via the Passport 'jwt' strategy
 * (cookie first, then Authorization header). Skips routes marked @Public().
 *
 * Uses explicit property assignment (not TypeScript parameter properties)
 * because the dev runtime (tsx/esbuild) doesn't reliably transform
 * `constructor(private x: X)` when decorator metadata is involved.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
