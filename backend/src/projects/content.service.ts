import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DB, Db } from '../db/database';
import { experiences, skillGroups } from '../db/schema';
import { CreateExperienceDto, CreateSkillGroupDto, UpdateExperienceDto, UpdateSkillGroupDto } from './projects.dto';

// Experience (work, education, certifications) and skill groups: the CV sections of the site.
@Injectable()
export class ContentService {
  constructor(@Inject(DB) private readonly db: Db) {}

  listExperiences(includeDrafts: boolean) {
    return this.db.select().from(experiences)
      .where(includeDrafts ? undefined : eq(experiences.published, true))
      .orderBy(asc(experiences.kind), asc(experiences.sortOrder), asc(experiences.title));
  }

  async createExperience(input: CreateExperienceDto) {
    const [row] = await this.db.insert(experiences).values(input).returning();
    return row;
  }

  async updateExperience(id: string, input: UpdateExperienceDto) {
    const [row] = await this.db.update(experiences).set({ ...input, updatedAt: new Date() }).where(eq(experiences.id, id)).returning();
    if (!row) throw new NotFoundException();
    return row;
  }

  async removeExperience(id: string) {
    const [row] = await this.db.delete(experiences).where(eq(experiences.id, id)).returning({ id: experiences.id });
    if (!row) throw new NotFoundException();
  }

  listSkills() {
    return this.db.select().from(skillGroups).orderBy(asc(skillGroups.sortOrder), asc(skillGroups.name));
  }

  async createSkillGroup(input: CreateSkillGroupDto) {
    const [row] = await this.db.insert(skillGroups).values(input).returning();
    return row;
  }

  async updateSkillGroup(id: string, input: UpdateSkillGroupDto) {
    const [row] = await this.db.update(skillGroups).set(input).where(eq(skillGroups.id, id)).returning();
    if (!row) throw new NotFoundException();
    return row;
  }

  async removeSkillGroup(id: string) {
    const [row] = await this.db.delete(skillGroups).where(eq(skillGroups.id, id)).returning({ id: skillGroups.id });
    if (!row) throw new NotFoundException();
  }
}
