import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// --- USERS & AUTH ---
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role', { enum: ['user', 'god'] }).default('user'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// --- PROFILES ---
export const profiles = sqliteTable('profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  jobTitle: text('job_title'),
  organization: text('organization'),
  bio: text('bio'),
  skills: text('skills'),
  location: text('location'),
});

// --- WORKSPACES ---
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// --- SUBSCRIPTIONS & QUOTAS ---
export const subscriptions = sqliteTable('subscriptions', {
  workspaceId: text('workspace_id').primaryKey().references(() => workspaces.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['free', 'solo', 'collective', 'business', 'major'] }).default('free'),
  pdfExportsLimit: integer('pdf_exports_limit').default(1),
  pdfExportsUsed: integer('pdf_exports_used').default(0),
  aiCreditsLimit: integer('ai_credits_limit').default(100),
  aiCreditsUsed: integer('ai_credits_used').default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});

// --- INVITE CODES ---
export const inviteCodes = sqliteTable('invite_codes', {
  code: text('code').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull(),
  maxUses: integer('max_uses').default(1),
  usesCount: integer('uses_count').default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  note: text('note'),
});
