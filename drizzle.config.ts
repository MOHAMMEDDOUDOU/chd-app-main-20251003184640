import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/database/config.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_lWDH8R6uOiFN@ep-aged-water-a2koqhuu-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
  verbose: true,
  strict: true,
} satisfies Config;
