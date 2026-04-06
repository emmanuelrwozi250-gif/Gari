/**
 * ROI Calculator — Buy & Earn Engine
 *
 * Calculates income potential for a car purchased and listed on Gari.
 * All values in RWF (Rwandan Francs).
 * Income estimates are NOT guaranteed — always display disclaimer.
 */

export interface ROIInput {
  vehiclePurchasePriceRwf: number;
  estimatedRepairCostRwf: number;
  registrationCostRwf: number;
  importDutiesRwf: number;
  comparableDailyRateRwf: number;   // from live listings — same make/model/year
  comparableListingsCount: number;  // how many real listings were found
  occupancyPct: number;             // default 65
  maintenanceReservePct: number;    // default 10
}

export interface ROIOutput {
  totalLandedCostRwf: number;
  monthlyGrossRevenueRwf: number;
  monthlyMaintenanceReserveRwf: number;
  monthlyNetRevenueRwf: number;
  paybackMonths: number;
  annualRoiPct: number;
  confidence: 'low' | 'medium' | 'high';
  disclaimer: string;
}

const DISCLAIMER =
  'Income estimates are based on similar cars listed on Gari and an assumed ' +
  'occupancy rate. Actual earnings depend on demand, condition, and your pricing. ' +
  'Listing on Gari after purchase is entirely optional.';

export function calculateROI(input: ROIInput): ROIOutput {
  const {
    vehiclePurchasePriceRwf,
    estimatedRepairCostRwf,
    registrationCostRwf,
    importDutiesRwf,
    comparableDailyRateRwf,
    comparableListingsCount,
    occupancyPct,
    maintenanceReservePct,
  } = input;

  const totalLandedCostRwf =
    vehiclePurchasePriceRwf +
    estimatedRepairCostRwf +
    registrationCostRwf +
    importDutiesRwf;

  const daysPerMonth = 30.44;
  const bookedDaysPerMonth = daysPerMonth * (occupancyPct / 100);
  const monthlyGrossRevenueRwf = Math.round(comparableDailyRateRwf * bookedDaysPerMonth);
  const monthlyMaintenanceReserveRwf = Math.round(monthlyGrossRevenueRwf * (maintenanceReservePct / 100));
  const monthlyNetRevenueRwf = monthlyGrossRevenueRwf - monthlyMaintenanceReserveRwf;

  const paybackMonths =
    monthlyNetRevenueRwf > 0
      ? Math.ceil(totalLandedCostRwf / monthlyNetRevenueRwf)
      : 9999;

  const annualNetRevenue = monthlyNetRevenueRwf * 12;
  const annualRoiPct =
    totalLandedCostRwf > 0
      ? Math.round((annualNetRevenue / totalLandedCostRwf) * 100)
      : 0;

  const confidence: 'low' | 'medium' | 'high' =
    comparableListingsCount >= 5
      ? 'high'
      : comparableListingsCount >= 3
      ? 'medium'
      : 'low';

  return {
    totalLandedCostRwf,
    monthlyGrossRevenueRwf,
    monthlyMaintenanceReserveRwf,
    monthlyNetRevenueRwf,
    paybackMonths,
    annualRoiPct,
    confidence,
    disclaimer: DISCLAIMER,
  };
}

/** Fetch comparable daily rate from live Gari listings. */
export async function getComparableRate(
  make: string,
  model: string,
  year: number,
  prisma: any
): Promise<{ rate: number; count: number }> {
  try {
    const yearMin = year - 2;
    const yearMax = year + 2;

    const listings = await prisma.car.findMany({
      where: {
        isAvailable: true,
        year: { gte: yearMin, lte: yearMax },
        OR: [
          { make: { contains: make, mode: 'insensitive' } },
          { model: { contains: model, mode: 'insensitive' } },
        ],
      },
      select: { pricePerDay: true },
      take: 20,
    });

    if (listings.length === 0) {
      // Fallback: use Rwanda market average by car type
      return { rate: 40000, count: 0 };
    }

    const avg = Math.round(
      listings.reduce((sum: number, l: any) => sum + l.pricePerDay, 0) / listings.length
    );

    return { rate: avg, count: listings.length };
  } catch {
    return { rate: 40000, count: 0 };
  }
}
