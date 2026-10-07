import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN_EMAIL, PASSWORD, signIn, testApp } from './helpers';

describe('admin auth', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => { app = await testApp(); });
  afterAll(() => app.close());

  it('rejects a wrong password or an unknown email with the same answer', async () => {
    await http().post('/api/auth/login').send({ email: ADMIN_EMAIL, password: 'nope' }).expect(401);
    await http().post('/api/auth/login').send({ email: 'someone@example.com', password: PASSWORD }).expect(401);
  });

  it('sets an httpOnly, SameSite=Strict session cookie scoped to /api', async () => {
    const res = await http().post('/api/auth/login').send({ email: ` ${ADMIN_EMAIL.toUpperCase()} `, password: PASSWORD }).expect(200);
    const cookie = ([] as string[]).concat(res.headers['set-cookie'])[0];
    expect(cookie).toMatch(/^pf_admin=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api/);
  });

  it('reports the session and signs out', async () => {
    const headers = await signIn(app);
    await http().get('/api/auth/me').set(headers).expect(200, { email: ADMIN_EMAIL });
    await http().get('/api/auth/me').expect(401);
    const res = await http().post('/api/auth/logout').set(headers).expect(204);
    expect(([] as string[]).concat(res.headers['set-cookie'])[0]).toMatch(/pf_admin=;/);
  });

  it('protects every admin route', async () => {
    await http().get('/api/admin/projects').expect(401);
    await http().post('/api/admin/projects').send({ slug: 'x', title: 'X' }).expect(401);
    await http().get('/api/admin/projects').set('Cookie', 'pf_admin=forged.token.value').expect(401);
  });

  it('requires the client header on writes (CSRF defence in depth)', async () => {
    const { Cookie } = await signIn(app);
    await http().post('/api/admin/projects').set('Cookie', Cookie).send({ slug: 'csrf', title: 'CSRF' }).expect(403);
    await http().get('/api/admin/projects').set('Cookie', Cookie).expect(200);
  });

  it('signs every session out when the password hash changes', async () => {
    const headers = await signIn(app);
    const other = await testApp({ ADMIN_PASSWORD_HASH: 'scrypt$16384$8$1$c2FsdA$aGFzaA' });
    try {
      await request(other.getHttpServer()).get('/api/admin/projects').set(headers).expect(401);
    } finally {
      await other.close();
    }
  });

  it('disables sign-in when no admin is configured', async () => {
    const open = await testApp({ ADMIN_EMAIL: '', ADMIN_PASSWORD_HASH: '' });
    try {
      await request(open.getHttpServer()).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: PASSWORD }).expect(401);
    } finally {
      await open.close();
    }
  });
});
