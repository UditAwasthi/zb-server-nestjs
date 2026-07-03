import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),

  PORT: z.coerce.number().int().positive(),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(5),
  JWT_REFRESH_SECRET: z.string().min(5),

  ACCESS_TOKEN_EXPIRES_IN: z.custom<`${number}${string}`>(),
  REFRESH_TOKEN_EXPIRES_IN: z.custom<`${number}${string}`>(),

  RESEND_API_KEY: z.string(),

  APP_URL: z.string().url(),

  EMAIL_FROM: z.string().email(),

  GOOGLE_CLIENT_ID: z.string(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string(),
  SUPABASE_BUCKET: z.string(),
});

export const env = envSchema.parse(process.env);
