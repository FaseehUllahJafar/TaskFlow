import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

dotenv.config();

async function run() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log('Applying database migrations...');
        await migrate(drizzle(pool), { migrationsFolder: process.env.MIGRATIONS_DIR || path.resolve(__dirname, '../../src/db/migrations') });
        console.log('Migrations applied.');
    } finally {
        await pool.end();
    }
}

run().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
