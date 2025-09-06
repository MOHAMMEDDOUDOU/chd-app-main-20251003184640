// Configuration for React Native/Expo environment
export const CONFIG = {
  DATABASE_URL: "postgresql://neondb_owner:npg_lWDH8R6uOiFN@ep-aged-water-a2koqhuu-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  JWT_SECRET: "your-super-secret-jwt-key-change-this-in-production",
  JWT_EXPIRES_IN: "7d",
  NODE_ENV: "development"
};

// Environment variables for React Native/Expo
export const ENV = {
  NEON_DATABASE_URL: CONFIG.DATABASE_URL,
  JWT_SECRET: CONFIG.JWT_SECRET,
  JWT_EXPIRES_IN: CONFIG.JWT_EXPIRES_IN,
  NODE_ENV: CONFIG.NODE_ENV,
};
