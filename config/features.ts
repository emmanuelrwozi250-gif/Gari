/**
 * Feature flags — controlled by environment variables.
 * Default state enforces RURA compliance (no P2P, no insurance addons yet).
 *
 * To enable a flag: set the env var to 'true' in Vercel project settings.
 */
export const FEATURES = {
  /**
   * P2P listings: OFF per RURA guidance.
   * Only COMMERCIAL vehicles may be listed.
   * Enable: FEATURE_P2P=true
   */
  enableP2pListings: process.env.FEATURE_P2P === 'true',

  /**
   * Insurance add-on products (future Gari Protect integration).
   * Enable: FEATURE_INSURANCE_ADDONS=true
   */
  enableInsuranceAddons: process.env.FEATURE_INSURANCE_ADDONS === 'true',

  /**
   * AI-driven dynamic pricing engine.
   * Enable: FEATURE_DYNAMIC_PRICING=true
   */
  enableDynamicPricing: process.env.FEATURE_DYNAMIC_PRICING === 'true',

  /**
   * Corporate accounts with purchase orders and invoicing.
   * Enable: FEATURE_CORPORATE_ACCOUNTS=true
   */
  enableCorporateAccounts: process.env.FEATURE_CORPORATE_ACCOUNTS === 'true',
} as const;
