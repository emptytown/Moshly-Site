import { defineConfig } from 'drizzle-kit';

const databaseId = process.env.MOSHLY_DB_ID;
if (!databaseId) throw new Error('MOSHLY_DB_ID environment variable is required');

export default defineConfig({
  schema: './functions/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    databaseId,
  },
});
