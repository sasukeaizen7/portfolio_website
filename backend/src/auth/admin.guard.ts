import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, SESSION_COOKIE } from './auth.service';

export const CLIENT_HEADER = 'x-portfolio-client';

// Admin routes: a valid session cookie, and on writes a custom header that a cross-site form can't send
// (defence in depth on top of SameSite=Strict).
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!this.auth.verify(req.cookies?.[SESSION_COOKIE])) throw new UnauthorizedException();
    if (req.method !== 'GET' && req.headers[CLIENT_HEADER] !== 'web') throw new ForbiddenException('Missing client header');
    return true;
  }
}
