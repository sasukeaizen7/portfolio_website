import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { signIn, testApp } from './helpers';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4c30000000049454e44ae426082', 'hex');

describe('projects', () => {
  let app: INestApplication;
  let admin: Record<string, string>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await testApp();
    admin = await signIn(app);
  });
  afterAll(() => app.close());

  it('serves the seeded projects and profile publicly', async () => {
    const { body } = await http().get('/api/projects').expect(200);
    expect(body).toHaveLength(29);
    expect(new Set(body.map((p: { category: string }) => p.category))).toEqual(new Set(['Data pipelines', 'SQL analytics']));
    const velib = (await http().get('/api/projects/velib-live-pipeline').expect(200)).body;
    expect(velib).toMatchObject({ title: "Vélib' Paris: live pipeline", featured: true, imageUrl: null });
    expect((await http().get('/api/profile').expect(200)).body).toMatchObject({ name: 'sasukeaizen7', githubUrl: 'https://github.com/sasukeaizen7' });
  });

  it('creates, edits and deletes a project; drafts stay private', async () => {
    const created = (await http().post('/api/admin/projects').set(admin)
      .send({ slug: 'new-thing', title: '  New thing ', tags: ['a', ' b ', ''], color: '#ABCDEF', published: false }).expect(201)).body;
    expect(created).toMatchObject({ title: 'New thing', tags: ['a', 'b'], color: '#abcdef', category: 'Projects', published: false });

    await http().get('/api/projects/new-thing').expect(404);
    expect((await http().get('/api/projects').expect(200)).body.some((p: { slug: string }) => p.slug === 'new-thing')).toBe(false);
    expect((await http().get('/api/admin/projects').set(admin).expect(200)).body.some((p: { slug: string }) => p.slug === 'new-thing')).toBe(true);

    const updated = (await http().patch(`/api/admin/projects/${created.id}`).set(admin)
      .send({ published: true, repoUrl: 'https://github.com/x/y', summary: 'Hi' }).expect(200)).body;
    expect(updated).toMatchObject({ published: true, repoUrl: 'https://github.com/x/y', summary: 'Hi', title: 'New thing' });
    await http().get('/api/projects/new-thing').expect(200);

    expect((await http().patch(`/api/admin/projects/${created.id}`).set(admin).send({ repoUrl: '' }).expect(200)).body.repoUrl).toBeNull();

    await http().delete(`/api/admin/projects/${created.id}`).set(admin).expect(204);
    await http().delete(`/api/admin/projects/${created.id}`).set(admin).expect(404);
  });

  it('validates input', async () => {
    const bad = [
      { slug: 'Bad Slug', title: 'x' },
      { slug: 'ok', title: '' },
      { slug: 'ok', title: 'x', repoUrl: 'javascript:alert(1)' },
      { slug: 'ok', title: 'x', demoUrl: 'ftp://example.com' },
      { slug: 'ok', title: 'x', color: 'red' },
      { slug: 'ok', title: 'x', tags: 'not-a-list' },
      { slug: 'ok', title: 'x', unknownField: 1 },
    ];
    for (const body of bad) await http().post('/api/admin/projects').set(admin).send(body).expect(400);
    await http().post('/api/admin/projects').set(admin).send({ slug: 'python-etl', title: 'Dup' }).expect(409);
    await http().patch('/api/admin/projects/not-a-uuid').set(admin).send({ title: 'x' }).expect(400);
  });

  it('uploads images, sniffing the type from the bytes', async () => {
    const { body } = await http().post('/api/admin/images').set(admin).attach('file', PNG, { filename: 'shot.jpg', contentType: 'image/jpeg' }).expect(201);
    const res = await http().get(body.url).expect(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toMatch(/immutable/);

    await http().post('/api/admin/images').set(admin).attach('file', Buffer.from('<svg onload=alert(1)>'), { filename: 'x.png', contentType: 'image/png' }).expect(400);
    await http().post('/api/admin/images').set(admin).attach('file', Buffer.alloc(4 * 1024 * 1024 + 1), 'big.png').expect(413);

    const project = (await http().post('/api/admin/projects').set(admin).send({ slug: 'with-image', title: 'With image', imageId: body.id }).expect(201)).body;
    expect(project.imageUrl).toBe(body.url);
    await http().post('/api/admin/projects').set(admin).send({ slug: 'bad-image', title: 'x', imageId: '00000000-0000-4000-8000-000000000000' }).expect(404);
  });

  it('updates the profile', async () => {
    const body = { name: 'Me', headline: 'Data engineer', bio: 'Hello', githubUrl: 'https://github.com/me', linkedinUrl: '', contactEmail: 'me@example.com' };
    expect((await http().put('/api/admin/profile').set(admin).send(body).expect(200)).body)
      .toEqual({ name: 'Me', headline: 'Data engineer', bio: 'Hello', githubUrl: 'https://github.com/me', linkedinUrl: null, contactEmail: 'me@example.com' });
    await http().put('/api/admin/profile').set(admin).send({ ...body, contactEmail: 'not-an-email' }).expect(400);
  });
});
