import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './functions/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    databaseId: '078bb103-ae9b-4975-9e21-66877f480333',
  },
});
