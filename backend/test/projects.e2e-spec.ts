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
    expect(body).toHaveLength(32);
    expect(new Set(body.map((p: { category: string }) => p.category)))
      .toEqual(new Set(['AI & Computer Vision', 'Data Engineering', 'SQL & Analytics', 'Web & Software']));
    expect(body.some((p: { period: string }) => /day/i.test(p.period))).toBe(false);
    const velib = (await http().get('/api/projects/velib-live-pipeline').expect(200)).body;
    expect(velib).toMatchObject({ title: "Vélib' Paris: live pipeline", featured: true, imageUrl: null });
    expect((await http().get('/api/profile').expect(200)).body)
      .toMatchObject({ name: 'Mohamed Abderrahmane Heouaine', title: 'AI & Data Engineer', location: 'Paris, France', photoUrl: '/photo.png' });
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
    const body = {
      name: 'Me', title: 'Engineer', headline: 'Data engineer', bio: 'Hello', location: 'Lyon', availability: 'Open',
      languages: ['French', ' English '], photoUrl: '/api/images/x', cvUrl: '', githubUrl: 'https://github.com/me', linkedinUrl: '', contactEmail: 'me@example.com',
    };
    expect((await http().put('/api/admin/profile').set(admin).send(body).expect(200)).body).toEqual({
      ...body, languages: ['French', 'English'], cvUrl: null, linkedinUrl: null,
    });
    await http().put('/api/admin/profile').set(admin).send({ ...body, contactEmail: 'not-an-email' }).expect(400);
    await http().put('/api/admin/profile').set(admin).send({ ...body, photoUrl: 'javascript:alert(1)' }).expect(400);
    await http().put('/api/admin/profile').set(admin).send({ ...body, cvUrl: '//evil.example/cv.pdf' }).expect(400);
  });

  it('serves experience and skills, and lets the admin manage them', async () => {
    const list = (await http().get('/api/experiences').expect(200)).body;
    expect(list.filter((e: { kind: string }) => e.kind === 'work')).toHaveLength(3);
    expect(list.filter((e: { kind: string }) => e.kind === 'certification')).toHaveLength(4);
    expect((await http().get('/api/skills').expect(200)).body.map((g: { name: string }) => g.name)[0]).toBe('AI & Machine Learning');

    await http().post('/api/admin/experiences').send({ kind: 'work', title: 'x' }).expect(401);
    await http().post('/api/admin/experiences').set(admin).send({ kind: 'hobby', title: 'x' }).expect(400);
    const job = (await http().post('/api/admin/experiences').set(admin)
      .send({ kind: 'work', title: 'Freelance AI engineer', startLabel: '2026', endLabel: 'Present', highlights: ['a', ''], published: false }).expect(201)).body;
    expect(job).toMatchObject({ highlights: ['a'], published: false });
    expect((await http().get('/api/experiences').expect(200)).body.some((e: { id: string }) => e.id === job.id)).toBe(false);
    await http().patch(`/api/admin/experiences/${job.id}`).set(admin).send({ published: true }).expect(200);
    expect((await http().get('/api/experiences').expect(200)).body.some((e: { id: string }) => e.id === job.id)).toBe(true);
    await http().delete(`/api/admin/experiences/${job.id}`).set(admin).expect(204);

    const group = (await http().post('/api/admin/skills').set(admin).send({ name: 'Tools', items: ['Git', ' Docker '] }).expect(201)).body;
    expect(group.items).toEqual(['Git', 'Docker']);
    await http().patch(`/api/admin/skills/${group.id}`).set(admin).send({ items: ['Git'] }).expect(200);
    await http().delete(`/api/admin/skills/${group.id}`).set(admin).expect(204);
  });

  it('accepts a PDF CV on the files endpoint only, served as a download', async () => {
    const pdf = Buffer.from('%PDF-1.4\n%fake but sniffable\n');
    await http().post('/api/admin/images').set(admin).attach('file', pdf, 'cv.pdf').expect(400);
    const { body } = await http().post('/api/admin/files').set(admin).attach('file', pdf, 'cv.pdf').expect(201);
    expect(body.url).toMatch(/^\/api\/files\//);
    const res = await http().get(body.url).expect(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });
});
