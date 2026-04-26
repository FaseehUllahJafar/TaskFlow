import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_ACCESS_EXPIRATION: z.string().default('15m'),
    FRONTEND_URL: z.string().url(),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ');
    console.error(`Invalid environment configuration:\n  ${problems}`);
    process.exit(1);
}

export const env = parsed.data;
