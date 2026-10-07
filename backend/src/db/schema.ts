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
  title: text('title').notNull().default(''),
  headline: text('headline').notNull(),
  bio: text('bio').notNull(),
  location: text('location').notNull().default(''),
  availability: text('availability').notNull().default(''),
  languages: text('languages').array().notNull().default([]),
  photoUrl: text('photo_url'),
  cvUrl: text('cv_url'),
  githubUrl: text('github_url'),
  linkedinUrl: text('linkedin_url'),
  contactEmail: text('contact_email'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const experiences = pgTable('experiences', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(), // work | education | certification
  title: text('title').notNull(),
  organization: text('organization').notNull().default(''),
  location: text('location').notNull().default(''),
  startLabel: text('start_label').notNull().default(''),
  endLabel: text('end_label').notNull().default(''),
  summary: text('summary').notNull().default(''),
  highlights: text('highlights').array().notNull().default([]),
  tags: text('tags').array().notNull().default([]),
  url: text('url'),
  published: boolean('published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const skillGroups = pgTable('skill_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  items: text('items').array().notNull().default([]),
  sortOrder: integer('sort_order').notNull().default(0),
});
