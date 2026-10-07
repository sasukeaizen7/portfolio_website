// Drizzle mirror of migrations/*.sql (the SQL files are the source of truth).
import { boolean, customType, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' });

export const projectImages = pgTable('project_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  bytes: bytea('bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default('Projects'),
  period: text('period').notNull().default(''),
  tags: text('tags').array().notNull().default([]),
  highlights: text('highlights').array().notNull().default([]),
  repoUrl: text('repo_url'),
  demoUrl: text('demo_url'),
  imageId: uuid('image_id').references(() => projectImages.id, { onDelete: 'set null' }),
  color: text('color').notNull().default('#2dd4bf'),
  featured: boolean('featured').notNull().default(false),
  published: boolean('published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profile = pgTable('profile', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  headline: text('headline').notNull(),
  bio: text('bio').notNull(),
  githubUrl: text('github_url'),
  linkedinUrl: text('linkedin_url'),
  contactEmail: text('contact_email'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
