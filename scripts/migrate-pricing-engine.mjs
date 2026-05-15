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
  // ── PricingRule table ──────────────────────────────────────────────────────
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "PricingRule" (
    "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
    "name"        TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "enabled"     BOOLEAN NOT NULL DEFAULT true,
    "multiplier"  FLOAT8 NOT NULL,
    "priority"    INTEGER NOT NULL DEFAULT 0,
    "startDate"   DATE,
    "endDate"     DATE,
    "dayOfWeek"   INTEGER[] NOT NULL DEFAULT '{}',
    "minDays"     INTEGER,
    "description" TEXT,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
  )`);
  console.log('PricingRule table created');

  // ── Unique constraint on name (idempotent seeding) ─────────────────────────
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PricingRule_name_key'
      ) THEN
        ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_name_key" UNIQUE ("name");
      END IF;
    END $$
  `);

  // ── Booking snapshot columns ───────────────────────────────────────────────
  await prisma.$executeRawUnsafe(`ALTER TABLE "Booking"
    ADD COLUMN IF NOT EXISTS "pricingSnapshot"       JSONB,
    ADD COLUMN IF NOT EXISTS "totalRwf"              INTEGER,
    ADD COLUMN IF NOT EXISTS "vatRwf"                INTEGER,
    ADD COLUMN IF NOT EXISTS "baseSubtotalRwf"       INTEGER,
    ADD COLUMN IF NOT EXISTS "dynamicAdjustmentRwf"  INTEGER,
    ADD COLUMN IF NOT EXISTS "averageMultiplier"     FLOAT8
  `);
  console.log('Booking snapshot columns added');

  // ── Seed 26 Rwanda pricing rules ──────────────────────────────────────────
  // SEASON RULES (7)
  const seasonRules = [
    {
      name: 'Christmas & New Year Season',
      type: 'season',
      multiplier: 1.20,
      priority: 10,
      startDate: '2024-12-20',
      endDate: '2025-01-03',
      description: 'Peak holiday season: flights full, hotels sold out — max demand',
    },
    {
      name: 'Kwita Izina (Gorilla Naming)',
      type: 'season',
      multiplier: 1.20,
      priority: 10,
      startDate: '2024-09-01',
      endDate: '2024-09-10',
      description: 'Annual gorilla naming ceremony draws international visitors',
    },
    {
      name: 'Easter Holiday Season',
      type: 'season',
      multiplier: 1.15,
      priority: 9,
      startDate: '2024-03-28',
      endDate: '2024-04-06',
      description: 'Easter weekend: domestic travel surge',
    },
    {
      name: 'Liberation & Independence Period',
      type: 'season',
      multiplier: 1.15,
      priority: 9,
      startDate: '2024-07-01',
      endDate: '2024-07-10',
      description: 'July 1 (Independence) + July 4 (Liberation Day) cluster',
    },
    {
      name: 'CHOGM & Summit Season',
      type: 'season',
      multiplier: 1.10,
      priority: 8,
      startDate: '2024-01-28',
      endDate: '2024-02-02',
      description: 'Regional summits and diplomatic events in Kigali',
    },
    {
      name: 'Gorilla Trekking Peak (Jun–Aug)',
      type: 'season',
      multiplier: 1.10,
      priority: 7,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      description: 'Dry season — gorilla trekking peak; highest inbound tourism',
    },
    {
      name: 'Low Season (Feb–Mar)',
      type: 'season',
      multiplier: 0.90,
      priority: 5,
      startDate: '2024-02-10',
      endDate: '2024-03-20',
      description: 'Long rains and low demand — discount to fill fleet',
    },
  ];

  // HOLIDAY RULES (9)
  const holidayRules = [
    {
      name: "New Year's Day",
      type: 'holiday',
      multiplier: 1.25,
      priority: 15,
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      description: 'Public holiday — Jan 1',
    },
    {
      name: "New Year Holiday",
      type: 'holiday',
      multiplier: 1.20,
      priority: 14,
      startDate: '2024-01-02',
      endDate: '2024-01-02',
      description: 'Public holiday — Jan 2',
    },
    {
      name: 'Heroes Day',
      type: 'holiday',
      multiplier: 1.15,
      priority: 12,
      startDate: '2024-02-01',
      endDate: '2024-02-01',
      description: 'Public holiday — Feb 1',
    },
    {
      name: 'Genocide Memorial Day',
      type: 'holiday',
      multiplier: 1.15,
      priority: 12,
      startDate: '2024-04-07',
      endDate: '2024-04-07',
      description: 'Public holiday — Apr 7; commemorative events across country',
    },
    {
      name: 'Labour Day',
      type: 'holiday',
      multiplier: 1.15,
      priority: 12,
      startDate: '2024-05-01',
      endDate: '2024-05-01',
      description: 'Public holiday — May 1',
    },
    {
      name: 'Independence Day',
      type: 'holiday',
      multiplier: 1.20,
      priority: 13,
      startDate: '2024-07-01',
      endDate: '2024-07-01',
      description: 'Public holiday — Jul 1',
    },
    {
      name: 'Liberation Day',
      type: 'holiday',
      multiplier: 1.20,
      priority: 13,
      startDate: '2024-07-04',
      endDate: '2024-07-04',
      description: 'Public holiday — Jul 4',
    },
    {
      name: 'Assumption Day',
      type: 'holiday',
      multiplier: 1.15,
      priority: 12,
      startDate: '2024-08-15',
      endDate: '2024-08-15',
      description: 'Public holiday — Aug 15',
    },
    {
      name: 'Christmas Day',
      type: 'holiday',
      multiplier: 1.20,
      priority: 13,
      startDate: '2024-12-25',
      endDate: '2024-12-25',
      description: 'Public holiday — Dec 25',
    },
  ];

  // DAY-OF-WEEK RULES (2)
  const dowRules = [
    {
      name: 'Weekend Surge (Fri–Sun)',
      type: 'day_of_week',
      multiplier: 1.15,
      priority: 6,
      dayOfWeek: [5, 6, 0], // Fri=5, Sat=6, Sun=0
      description: 'Friday through Sunday: weekend leisure travel premium',
    },
    {
      name: 'Monday Slow Day Discount',
      type: 'day_of_week',
      multiplier: 0.95,
      priority: 4,
      dayOfWeek: [1], // Mon=1
      description: 'Monday: lowest demand — small discount to stimulate bookings',
    },
  ];

  // LONG STAY RULES (8)
  const longStayRules = [
    { name: 'Long Stay 3+ Days', type: 'long_stay', multiplier: 0.97, priority: 3, minDays: 3, description: '3 or more days: small loyalty discount' },
    { name: 'Long Stay 5+ Days', type: 'long_stay', multiplier: 0.95, priority: 3, minDays: 5, description: '5+ days: growing commitment discount' },
    { name: 'Long Stay 7+ Days', type: 'long_stay', multiplier: 0.92, priority: 3, minDays: 7, description: '1-week rental: weekly loyalty rate' },
    { name: 'Long Stay 10+ Days', type: 'long_stay', multiplier: 0.90, priority: 3, minDays: 10, description: '10+ days: significant discount' },
    { name: 'Long Stay 14+ Days', type: 'long_stay', multiplier: 0.88, priority: 3, minDays: 14, description: '2-week rental: two-week loyalty rate' },
    { name: 'Long Stay 21+ Days', type: 'long_stay', multiplier: 0.85, priority: 3, minDays: 21, description: '3-week rental: extended stay rate' },
    { name: 'Long Stay 28+ Days', type: 'long_stay', multiplier: 0.82, priority: 3, minDays: 28, description: 'Monthly rental: corporate/expat monthly rate' },
    { name: 'Long Stay 60+ Days', type: 'long_stay', multiplier: 0.80, priority: 3, minDays: 60, description: '2-month+ rental: best long-term rate (floor)' },
  ];

  // Insert season rules
  for (const rule of seasonRules) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PricingRule" ("name","type","multiplier","priority","startDate","endDate","dayOfWeek","description")
      VALUES ($1,$2,$3,$4,$5,$6,'{}', $7)
      ON CONFLICT ("name") DO NOTHING
    `, rule.name, rule.type, rule.multiplier, rule.priority, rule.startDate, rule.endDate, rule.description);
  }
  console.log(`Season rules seeded: ${seasonRules.length}`);

  // Insert holiday rules
  for (const rule of holidayRules) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PricingRule" ("name","type","multiplier","priority","startDate","endDate","dayOfWeek","description")
      VALUES ($1,$2,$3,$4,$5,$6,'{}', $7)
      ON CONFLICT ("name") DO NOTHING
    `, rule.name, rule.type, rule.multiplier, rule.priority, rule.startDate, rule.endDate, rule.description);
  }
  console.log(`Holiday rules seeded: ${holidayRules.length}`);

  // Insert day-of-week rules
  for (const rule of dowRules) {
    const dowArray = '{' + rule.dayOfWeek.join(',') + '}';
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PricingRule" ("name","type","multiplier","priority","dayOfWeek","description")
      VALUES ($1,$2,$3,$4,$5::integer[],$6)
      ON CONFLICT ("name") DO NOTHING
    `, rule.name, rule.type, rule.multiplier, rule.priority, dowArray, rule.description);
  }
  console.log(`Day-of-week rules seeded: ${dowRules.length}`);

  // Insert long-stay rules
  for (const rule of longStayRules) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PricingRule" ("name","type","multiplier","priority","minDays","dayOfWeek","description")
      VALUES ($1,$2,$3,$4,$5,'{}', $6)
      ON CONFLICT ("name") DO NOTHING
    `, rule.name, rule.type, rule.multiplier, rule.priority, rule.minDays, rule.description);
  }
  console.log(`Long-stay rules seeded: ${longStayRules.length}`);

  await prisma.$disconnect();
  console.log('All done — pricing engine migration complete');
}

main().catch(e => { console.error(e.message); process.exit(1); });
