import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';

// Read DATABASE_URL from .env
const envContent = readFileSync('.env', 'utf-8');
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error('DATABASE_URL not found in .env');
const DATABASE_URL = match[1].trim();

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "NewsletterSignup" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
    "email"     TEXT NOT NULL UNIQUE,
    "district"  TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  console.log('NewsletterSignup table created (or already exists)');
  await prisma.$disconnect();
  console.log('Done');
}

main().catch(e => { console.error(e.message); process.exit(1); });
