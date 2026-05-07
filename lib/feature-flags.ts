import { prisma } from '@/lib/prisma';

export type FlagKey =
  | 'p2p_listings'
  | 'insurance_addons'
  | 'dynamic_pricing'
  | 'corporate_accounts'
  | 'boost_marketplace';

const ENV_DEFAULTS: Record<FlagKey, boolean> = {
  p2p_listings:        process.env.FEATURE_P2P === 'true',
  insurance_addons:    process.env.FEATURE_INSURANCE_ADDONS === 'true',
  dynamic_pricing:     process.env.FEATURE_DYNAMIC_PRICING === 'true',
  corporate_accounts:  process.env.FEATURE_CORPORATE_ACCOUNTS === 'true',
  boost_marketplace:   true, // always enabled — core revenue feature
};

/**
 * Checks a feature flag from the DB, falling back to the env-var value
 * if the flag isn't seeded yet.  Safe to call server-side only.
 */
export async function getFlag(key: FlagKey): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (flag !== null) return flag.enabled;
  } catch {
    // DB might not have the table yet during local dev — fall through to env
  }
  return ENV_DEFAULTS[key] ?? false;
}

/**
 * Returns all flags as a key→boolean map.
 * Use on admin pages to render the full flag list.
 */
export async function getAllFlags(): Promise<Record<string, { enabled: boolean; description: string | null; updatedAt: Date }>> {
  try {
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    return Object.fromEntries(
      flags.map(f => [f.key, { enabled: f.enabled, description: f.description, updatedAt: f.updatedAt }])
    );
  } catch {
    return {};
  }
}
