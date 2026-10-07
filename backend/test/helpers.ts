import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/app.factory';
import { hashPassword } from '../src/common/password';
import { loadConfig } from '../src/config';

export const ADMIN_EMAIL = 'admin@example.com';
export const PASSWORD = 'correct horse battery staple';
const passwordHash = hashPassword(PASSWORD);

// Tests run on in-memory PGlite. Set TEST_DATABASE_URL to run them against a real (empty) PostgreSQL instead.
export async function testApp(env: Record<string, string> = {}) {
  const config = loadConfig({
    NODE_ENV: 'test',
    PGLITE_DIR: 'memory',
    ...(process.env.TEST_DATABASE_URL && { DATABASE_URL: process.env.TEST_DATABASE_URL }),
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: await passwordHash,
    RATE_LIMIT: 'off',
    ...env,
  });
  const app = await createApp(config);
  await app.init();
  return app;
}

// Signs in as the admin. Returns headers for admin requests (session cookie + client header).
export async function signIn(app: INestApplication) {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: PASSWORD }).expect(200);
  const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('pf_admin='))!;
  return { Cookie: cookie.split(';')[0], 'X-Portfolio-Client': 'web' };
}
