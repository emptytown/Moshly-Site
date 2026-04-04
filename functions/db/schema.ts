import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// --- USERS & AUTH ---
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role', { enum: ['user', 'god'] }).default('user'),
  avatarUrl: text('avatar_url'),
  resetToken: text('reset_token'),
  resetExpires: integer('reset_expires', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  verificationToken: text('verification_token'),
}, (table) => ({
  resetTokenIdx: index('reset_token_idx').on(table.resetToken),
}));

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
}, (table) => ({
  ownerIdIdx: index('owner_id_idx').on(table.ownerId),
}));

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
// God-issued codes that grant a specific plan for a set duration.
// durationMonths: 3 | 6 | 12 | 0 (0 = eternal/no expiry on subscription)
// expiresAt: when the *code itself* expires and can no longer be redeemed (null = no code expiry)
export const inviteCodes = sqliteTable('invite_codes', {
  code: text('code').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['free', 'solo', 'collective', 'business', 'major', 'semi_god', 'god'] }).notNull(),
  durationMonths: integer('duration_months').notNull().default(0), // 0 = eternal
  maxUses: integer('max_uses').default(1),
  usesCount: integer('uses_count').default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),         // code redemption deadline
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  workspaceIdIdx: index('invite_codes_workspace_id_idx').on(table.workspaceId),
}));
