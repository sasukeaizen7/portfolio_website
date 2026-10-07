import { randomBytes } from 'node:crypto';
import { Logger } from '@nestjs/common';

export interface AppConfig {
  port: number;
  production: boolean;
  databaseUrl: string | null;
  pgliteDir: string | null; // null = in-memory (tests)
  jwtSecret: string;
  admin: { email: string; passwordHash: string } | null; // null = admin sign-in disabled
  rateLimit: boolean;
  trustProxyHops: number; // reverse proxies in front of the API (Vercel rewrite + Render = 2)
}

export const CONFIG = Symbol('CONFIG');

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const production = env.NODE_ENV === 'production';
  const blank = (v?: string) => (v && v.trim() ? v.trim() : null);

  let jwtSecret = blank(env.JWT_SECRET);
  if (!jwtSecret) {
    if (production) throw new Error('JWT_SECRET is required in production');
    jwtSecret = randomBytes(48).toString('base64url');
    new Logger('Config').warn('JWT_SECRET not set: using a random one (admin sessions reset on restart)');
  } else if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  const databaseUrl = blank(env.DATABASE_URL);
  if (production && !databaseUrl) throw new Error('DATABASE_URL is required in production');

  // The admin account lives in the environment: there is no sign-up. Generate the hash with `npm run hash-password`.
  const adminEmail = blank(env.ADMIN_EMAIL)?.toLowerCase() ?? null;
  const adminHash = blank(env.ADMIN_PASSWORD_HASH);
  if (adminHash && !adminHash.startsWith('scrypt$')) throw new Error('ADMIN_PASSWORD_HASH must come from `npm run hash-password`');
  if (production && !(adminEmail && adminHash)) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD_HASH are required in production');
  if (!(adminEmail && adminHash)) new Logger('Config').warn('ADMIN_EMAIL / ADMIN_PASSWORD_HASH not set: admin sign-in is disabled');

  return {
    port: Number(env.PORT ?? 3100),
    production,
    databaseUrl,
    pgliteDir: env.PGLITE_DIR === 'memory' ? null : (blank(env.PGLITE_DIR) ?? './.data/pglite'),
    jwtSecret,
    admin: adminEmail && adminHash ? { email: adminEmail, passwordHash: adminHash } : null,
    rateLimit: env.RATE_LIMIT !== 'off',
    trustProxyHops: Number(env.TRUST_PROXY_HOPS ?? 1),
  };
}
