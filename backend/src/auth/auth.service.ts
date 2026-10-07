import { Inject, Injectable } from '@nestjs/common';
import { AppConfig, CONFIG } from '../config';
import { sha256, signJwt, verifyJwt } from '../common/crypto';
import { verifyPassword } from '../common/password';

export const SESSION_COOKIE = 'pf_admin';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

interface AdminClaims {
  sub: 'admin';
  email: string;
  pwd: string; // fingerprint of the password hash: changing ADMIN_PASSWORD_HASH signs every session out
}

@Injectable()
export class AuthService {
  constructor(@Inject(CONFIG) private readonly config: AppConfig) {}

  // Returns a session token, or null. Always runs scrypt so timing doesn't reveal whether the email matched.
  async login(email: string, password: string): Promise<string | null> {
    const admin = this.config.admin;
    const emailMatches = !!admin && email.trim().toLowerCase() === admin.email;
    const ok = await verifyPassword(password, emailMatches ? admin.passwordHash : null);
    if (!ok || !admin) return null;
    return signJwt({ sub: 'admin', email: admin.email, pwd: this.fingerprint() }, this.config.jwtSecret, SESSION_TTL_SECONDS);
  }

  verify(token: string | undefined): { email: string } | null {
    if (!token || !this.config.admin) return null;
    const claims = verifyJwt<AdminClaims>(token, this.config.jwtSecret);
    if (!claims || claims.sub !== 'admin' || claims.email !== this.config.admin.email || claims.pwd !== this.fingerprint()) return null;
    return { email: claims.email };
  }

  private fingerprint() {
    return sha256(this.config.admin?.passwordHash ?? '').slice(0, 16);
  }
}
