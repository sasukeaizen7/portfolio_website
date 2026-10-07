import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfig, CONFIG } from '../config';
import { AdminGuard } from './admin.guard';
import { LoginDto } from './auth.dto';
import { AuthService, SESSION_COOKIE, SESSION_TTL_SECONDS } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const token = await this.auth.login(body.email, body.password);
    if (!token) throw new UnauthorizedException('Wrong email or password');
    res.cookie(SESSION_COOKIE, token, { ...this.cookieOptions(), maxAge: SESSION_TTL_SECONDS * 1000 });
    return { email: this.config.admin!.email };
  }

  @Get('me')
  me(@Req() req: Request) {
    const admin = this.auth.verify(req.cookies?.[SESSION_COOKIE]);
    if (!admin) throw new UnauthorizedException();
    return admin;
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    return { httpOnly: true, secure: this.config.production, sameSite: 'strict', path: '/api' };
  }
}
