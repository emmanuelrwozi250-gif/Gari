/**
 * scripts/seed-public-holidays.mjs
 *
 * Additive holiday seed — safe to re-run (ON CONFLICT ("name") DO NOTHING).
 *
 * Adds to the existing 26 rules from migrate-pricing-engine.mjs:
 *   • Boxing Day (fixed, year-agnostic)
 *   • Good Friday 2024–2030  (always a Friday → stacks with Weekend Surge)
 *   • Easter Monday 2024–2030 (always a Monday → net +0.15 after Mon discount)
 *   • Umuganura Day 2024–2030 (first Friday of August — national harvest festival)
 *   • Long weekend bridge rules 2025–2028 (season-type, year-specific)
 *
 * Year-specific rules carry a `year` value so the engine only fires them in
 * the correct calendar year (engine.ts matchesDateRange respects this field).
 *
 * Run AFTER migrate-pricing-engine.mjs:
 *   node scripts/seed-public-holidays.mjs
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error('DATABASE_URL not found in .env');
const DATABASE_URL = match[1].trim();

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Ensure year column exists (idempotent) ────────────────────────────────
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "year" INTEGER
  `);
  console.log('✓ year column ensured on PricingRule');

  // ── Idempotent insert helper ──────────────────────────────────────────────
  async function seed(rule) {
    const {
      name, type, multiplier, priority,
      startDate, endDate, dayOfWeek, minDays, description, year,
    } = rule;
    const dow = '{' + (dayOfWeek ?? []).join(',') + '}';
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PricingRule"
        ("name","type","multiplier","priority","startDate","endDate","dayOfWeek","minDays","description","year")
      VALUES ($1,$2,$3,$4,$5,$6,$7::integer[],$8,$9,$10)
      ON CONFLICT ("name") DO NOTHING
    `,
      name, type, multiplier, priority ?? 5,
      startDate ?? null, endDate ?? null, dow,
      minDays ?? null, description ?? null, year ?? null,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FIXED HOLIDAY — year-agnostic, fires every Dec 26
  // ══════════════════════════════════════════════════════════════════════════
  await seed({
    name: 'Boxing Day',
    type: 'holiday', multiplier: 1.20, priority: 13,
    startDate: '2024-12-26', endDate: '2024-12-26', year: null,
    description: 'Public holiday — Dec 26. Pairs with Christmas for 2-day holiday window.',
  });
  console.log('✓ Boxing Day seeded');

  // ══════════════════════════════════════════════════════════════════════════
  // GOOD FRIDAY — always a Friday
  // Stacks with Weekend Surge (+0.15) for a total +0.30 delta → 1.20 ceiling
  // ══════════════════════════════════════════════════════════════════════════
  const goodFridays = [
    { year: 2024, date: '2024-03-29' },
    { year: 2025, date: '2025-04-18' },
    { year: 2026, date: '2026-04-03' },
    { year: 2027, date: '2027-03-26' },
    { year: 2028, date: '2028-04-14' },
    { year: 2029, date: '2029-03-30' },
    { year: 2030, date: '2030-04-19' },
  ];
  for (const { year, date } of goodFridays) {
    await seed({
      name: `Good Friday ${year}`,
      type: 'holiday', multiplier: 1.15, priority: 12,
      startDate: date, endDate: date, year,
      description: `Good Friday ${year} — always a Friday. Stacks with Weekend Surge (+0.15) for +0.30 total, capped at 1.20.`,
    });
  }
  console.log(`✓ Good Friday rules seeded: ${goodFridays.length}`);

  // ══════════════════════════════════════════════════════════════════════════
  // EASTER MONDAY — always a Monday
  // Net: +0.20 (holiday) − 0.05 (Mon slow-day) = +0.15 effective
  // ══════════════════════════════════════════════════════════════════════════
  const easterMondays = [
    { year: 2024, date: '2024-04-01' },
    { year: 2025, date: '2025-04-21' },
    { year: 2026, date: '2026-04-06' },
    { year: 2027, date: '2027-03-29' },
    { year: 2028, date: '2028-04-17' },
    { year: 2029, date: '2029-04-02' },
    { year: 2030, date: '2030-04-22' },
  ];
  for (const { year, date } of easterMondays) {
    await seed({
      name: `Easter Monday ${year}`,
      type: 'holiday', multiplier: 1.20, priority: 13,
      startDate: date, endDate: date, year,
      description: `Easter Monday ${year} — always a Monday. Net +0.15 after Monday slow-day offset.`,
    });
  }
  console.log(`✓ Easter Monday rules seeded: ${easterMondays.length}`);

  // ══════════════════════════════════════════════════════════════════════════
  // UMUGANURA DAY — Rwanda national harvest festival, first Friday of August
  // Always a Friday → stacks with Weekend Surge, hits 1.20 ceiling
  // ══════════════════════════════════════════════════════════════════════════
  const umuganura = [
    { year: 2024, date: '2024-08-02' }, // Aug 1 = Thu → first Fri = Aug 2
    { year: 2025, date: '2025-08-01' }, // Aug 1 = Fri
    { year: 2026, date: '2026-08-07' }, // Aug 1 = Sat → first Fri = Aug 7
    { year: 2027, date: '2027-08-06' }, // Aug 1 = Sun → first Fri = Aug 6
    { year: 2028, date: '2028-08-04' }, // Aug 1 = Tue → first Fri = Aug 4 (2028 is leap)
    { year: 2029, date: '2029-08-03' }, // Aug 1 = Wed → first Fri = Aug 3
    { year: 2030, date: '2030-08-02' }, // Aug 1 = Thu → first Fri = Aug 2
  ];
  for (const { year, date } of umuganura) {
    await seed({
      name: `Umuganura Day ${year}`,
      type: 'holiday', multiplier: 1.20, priority: 13,
      startDate: date, endDate: date, year,
      description: `Umuganura ${year} — national harvest festival, first Friday of August. Stacks with Weekend Surge for max +0.35, capped at 1.20.`,
    });
  }
  console.log(`✓ Umuganura Day rules seeded: ${umuganura.length}`);

  // ══════════════════════════════════════════════════════════════════════════
  // LONG WEEKEND BRIDGE RULES (season type, year-specific)
  //
  // These cover the full Fri–Mon or Thu–Sun stretch when a public holiday
  // creates a multi-day break. The engine stacks these on top of the
  // individual holiday rules and day-of-week rules for maximum accuracy.
  //
  // Day-of-week verification for 2025 (Jan 1 = Wed):
  //   Apr 7  = Mon (Genocide Memorial — Fri Apr 4 → Mon Apr 7, 4-day break)
  //   Apr 18 = Fri (Good Friday), Apr 21 = Mon (Easter Monday)
  //   Jul 4  = Fri (Liberation Day)
  //   Aug 1  = Fri (Umuganura)
  //   Aug 15 = Fri (Assumption Day)
  //   Dec 25 = Thu (Christmas) + Dec 26 = Fri (Boxing Day) → 4-day stretch
  //
  // Day-of-week verification for 2026 (Jan 1 = Thu):
  //   Apr 3  = Fri (Good Friday), Apr 6 = Mon (Easter Monday)
  //   May 1  = Fri (Labour Day)
  //   Aug 7  = Fri (Umuganura)
  //   Dec 25 = Fri (Christmas) + Dec 26 = Sat (Boxing Day)
  //
  // Day-of-week verification for 2027 (Jan 1 = Fri):
  //   Mar 26 = Fri (Good Friday), Mar 29 = Mon (Easter Monday)
  //   Aug 6  = Fri (Umuganura)
  //
  // Day-of-week verification for 2028 (Jan 1 = Sat, leap year):
  //   Apr 14 = Fri (Good Friday), Apr 17 = Mon (Easter Monday)
  //   Aug 4  = Fri (Umuganura)
  // ══════════════════════════════════════════════════════════════════════════
  const longWeekends = [
    // ── 2025 ─────────────────────────────────────────────────────────────
    {
      name: 'Long Weekend: Genocide Memorial Mon 2025',
      startDate: '2025-04-04', endDate: '2025-04-07', year: 2025,
      multiplier: 1.08, priority: 8,
      description: 'Genocide Memorial Apr 7 (Mon) 2025 — Fri Apr 4 to Mon Apr 7 (4-day break).',
    },
    {
      name: 'Long Weekend: Easter 2025',
      startDate: '2025-04-18', endDate: '2025-04-21', year: 2025,
      multiplier: 1.10, priority: 8,
      description: 'Easter 2025 — Good Friday Apr 18 to Easter Monday Apr 21 (4-day break).',
    },
    {
      name: 'Long Weekend: Liberation Fri 2025',
      startDate: '2025-07-04', endDate: '2025-07-06', year: 2025,
      multiplier: 1.08, priority: 7,
      description: 'Liberation Day Jul 4 (Fri) 2025 — Fri to Sun long weekend.',
    },
    {
      name: 'Long Weekend: Umuganura Fri 2025',
      startDate: '2025-08-01', endDate: '2025-08-03', year: 2025,
      multiplier: 1.08, priority: 7,
      description: 'Umuganura Aug 1 (Fri) 2025 — Fri to Sun long weekend.',
    },
    {
      name: 'Long Weekend: Assumption Fri 2025',
      startDate: '2025-08-15', endDate: '2025-08-17', year: 2025,
      multiplier: 1.08, priority: 7,
      description: 'Assumption Day Aug 15 (Fri) 2025 — Fri to Sun long weekend.',
    },
    {
      name: 'Long Weekend: Christmas-Boxing 2025',
      startDate: '2025-12-25', endDate: '2025-12-28', year: 2025,
      multiplier: 1.10, priority: 8,
      description: 'Christmas Thu Dec 25 + Boxing Day Fri Dec 26 + weekend Dec 27–28 — 4-day stretch.',
    },
    // ── 2026 ─────────────────────────────────────────────────────────────
    {
      name: 'Long Weekend: Easter 2026',
      startDate: '2026-04-03', endDate: '2026-04-06', year: 2026,
      multiplier: 1.10, priority: 8,
      description: 'Easter 2026 — Good Friday Apr 3 to Easter Monday Apr 6.',
    },
    {
      name: 'Long Weekend: Labour Fri 2026',
      startDate: '2026-05-01', endDate: '2026-05-03', year: 2026,
      multiplier: 1.08, priority: 7,
      description: 'Labour Day May 1 (Fri) 2026 — Fri to Sun long weekend.',
    },
    {
      name: 'Long Weekend: Umuganura Fri 2026',
      startDate: '2026-08-07', endDate: '2026-08-09', year: 2026,
      multiplier: 1.08, priority: 7,
      description: 'Umuganura Aug 7 (Fri) 2026 — Fri to Sun long weekend.',
    },
    {
      name: 'Long Weekend: Christmas Fri 2026',
      startDate: '2026-12-25', endDate: '2026-12-27', year: 2026,
      multiplier: 1.10, priority: 8,
      description: 'Christmas Fri Dec 25 2026 + Boxing Day Sat Dec 26 + Sun Dec 27.',
    },
    // ── 2027 ─────────────────────────────────────────────────────────────
    {
      name: 'Long Weekend: Easter 2027',
      startDate: '2027-03-26', endDate: '2027-03-29', year: 2027,
      multiplier: 1.10, priority: 8,
      description: 'Easter 2027 — Good Friday Mar 26 to Easter Monday Mar 29.',
    },
    {
      name: 'Long Weekend: Umuganura Fri 2027',
      startDate: '2027-08-06', endDate: '2027-08-08', year: 2027,
      multiplier: 1.08, priority: 7,
      description: 'Umuganura Aug 6 (Fri) 2027 — Fri to Sun long weekend.',
    },
    // ── 2028 ─────────────────────────────────────────────────────────────
    {
      name: 'Long Weekend: Easter 2028',
      startDate: '2028-04-14', endDate: '2028-04-17', year: 2028,
      multiplier: 1.10, priority: 8,
      description: 'Easter 2028 — Good Friday Apr 14 to Easter Monday Apr 17.',
    },
    {
      name: 'Long Weekend: Umuganura Fri 2028',
      startDate: '2028-08-04', endDate: '2028-08-06', year: 2028,
      multiplier: 1.08, priority: 7,
      description: 'Umuganura Aug 4 (Fri) 2028 — Fri to Sun long weekend.',
    },
  ];
  for (const rule of longWeekends) {
    await seed({ ...rule, type: 'season' });
  }
  console.log(`✓ Long weekend bridge rules seeded: ${longWeekends.length}`);

  const total = 1 + goodFridays.length + easterMondays.length + umuganura.length + longWeekends.length;
  console.log(`\n✅ All done. ${total} new rules attempted (skipped silently if name already exists).`);
  console.log('   Run node scripts/migrate-pricing-engine.mjs first if starting fresh.');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
