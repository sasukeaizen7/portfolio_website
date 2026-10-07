import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DB, Db } from '../db/database';
import { profile, projects } from '../db/schema';
import { CreateProjectDto, UpdateProfileDto, UpdateProjectDto } from './projects.dto';

type ProjectRow = typeof projects.$inferSelect;

const toJson = (p: ProjectRow) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  description: p.description,
  category: p.category,
  period: p.period,
  tags: p.tags,
  highlights: p.highlights,
  repoUrl: p.repoUrl,
  demoUrl: p.demoUrl,
  imageUrl: p.imageId ? `/api/images/${p.imageId}` : null,
  imageId: p.imageId,
  color: p.color,
  featured: p.featured,
  published: p.published,
  sortOrder: p.sortOrder,
  updatedAt: p.updatedAt,
});

// Postgres error codes that map to a client mistake rather than a server failure.
function rethrow(err: unknown): never {
  const code = (err as { code?: string; cause?: { code?: string } }).cause?.code ?? (err as { code?: string }).code;
  if (code === '23505') throw new ConflictException('A project with this slug already exists');
  if (code === '23503') throw new NotFoundException('Image not found');
  throw err;
}

@Injectable()
export class ProjectsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(includeDrafts: boolean) {
    const rows = await this.db.select().from(projects)
      .where(includeDrafts ? undefined : eq(projects.published, true))
      .orderBy(asc(projects.category), asc(projects.sortOrder), asc(projects.title));
    return rows.map(toJson);
  }

  async getPublished(slug: string) {
    const [row] = await this.db.select().from(projects).where(and(eq(projects.slug, slug), eq(projects.published, true)));
    if (!row) throw new NotFoundException();
    return toJson(row);
  }

  async create(input: CreateProjectDto) {
    try {
      const [row] = await this.db.insert(projects).values(input).returning();
      return toJson(row);
    } catch (err) {
      rethrow(err);
    }
  }

  async update(id: string, input: UpdateProjectDto) {
    let row: ProjectRow | undefined;
    try {
      [row] = await this.db.update(projects).set({ ...input, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    } catch (err) {
      rethrow(err);
    }
    if (!row) throw new NotFoundException();
    return toJson(row);
  }

  async remove(id: string) {
    const [row] = await this.db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
    if (!row) throw new NotFoundException();
  }

  async getProfile() {
    const [row] = await this.db.select().from(profile).where(eq(profile.id, 1));
    const { id: _id, updatedAt: _u, ...rest } = row;
    return rest;
  }

  async updateProfile(input: UpdateProfileDto) {
    const values = { githubUrl: null, linkedinUrl: null, contactEmail: null, photoUrl: null, cvUrl: null, ...input };
    await this.db.update(profile).set({ ...values, updatedAt: new Date() }).where(eq(profile.id, 1));
    return this.getProfile();
  }
}
