import { PremiumBreakdown } from './types';

// === Constants (Philippine Insurance Industry Standard) ===

// Depreciation: 20% year 1, then 10% declining balance
// Formula: FMV = SRP × 0.80 × 0.90^(age-1) for age >= 1
// Floor: 20% of SRP (never depreciates below this)

// Comprehensive tariff rates by vehicle age
export const COMP_RATES: Record<string, number> = {
  'new_to_3': 0.0225,    // 2.25% for 0-3 years
  '4_to_7': 0.0250,      // 2.50% for 4-7 years
  '8_plus': 0.0300,      // 3.00% for 8+ years
  'luxury': 0.0375,       // 3.75% for SRP > 3M
};

// CTPL rates (Insurance Commission Motor Car Tariff)
export const CTPL_RATES: Record<string, number> = {
  'private_car': 606,     // Private car, SUV, jeep, utility
  'ac_tourist': 786,      // AC and tourist cars
  'motorcycle': 296,      // Motorcycle, tricycle, trailer
  'light_truck': 656,     // Light/medium truck ≤3,930kg
  'heavy_truck': 1246,    // Heavy truck, private bus >3,930kg
};

// Tax rates
export const DST_RATE = 0.125;        // 12.5% Documentary Stamp Tax
export const VAT_RATE = 0.12;         // 12% Value Added Tax
export const LGT_RATE = 0.0015;       // 0.15% Local Gov't Tax
export const AUTH_FEES = 76;           // PIRA + OICP + Stradcom

// CTPL limit (IMC 2024-01)
export const CTPL_LIMIT = 200000;     // P200,000

/** Calculate vehicle depreciation */
export function calculateDepreciation(srp: number, vehicleAge: number): {
  fairMarketValue: number;
  depreciationPercent: number;
} {
  if (vehicleAge <= 0) {
    return { fairMarketValue: srp, depreciationPercent: 0 };
  }

  // Year 1: 20% off, then 10% per year declining balance
  let fmv = srp * 0.80; // Year 1
  for (let i = 1; i < vehicleAge; i++) {
    fmv *= 0.90; // 10% per year after
  }

  // Floor: 20% of SRP
  const floor = srp * 0.20;
  fmv = Math.max(fmv, floor);

  // Round to nearest peso
  fmv = Math.round(fmv);

  const depreciationPercent = ((srp - fmv) / srp) * 100;

  return { fairMarketValue: fmv, depreciationPercent: Math.round(depreciationPercent * 100) / 100 };
}

/** Get comprehensive premium rate based on vehicle age and SRP */
export function getComprehensiveRate(vehicleAge: number, srp: number): number {
  if (srp > 3_000_000) return COMP_RATES.luxury;
  if (vehicleAge <= 3) return COMP_RATES.new_to_3;
  if (vehicleAge <= 7) return COMP_RATES['4_to_7'];
  return COMP_RATES['8_plus'];
}

/** Get CTPL premium based on vehicle category */
export function getCtplPremium(category: string): number {
  // Map body types to CTPL categories
  const mapping: Record<string, string> = {
    sedan: 'private_car',
    hatchback: 'private_car',
    suv: 'private_car',
    mpv: 'private_car',
    van: 'private_car',
    pickup: 'light_truck',
    truck: 'heavy_truck',
    luxury: 'private_car',
  };
  const ctplCategory = mapping[category] ?? 'private_car';
  return CTPL_RATES[ctplCategory] ?? CTPL_RATES.private_car;
}

/** Calculate deductible (participation fee) */
export function calculateDeductible(fmv: number, isCommercial: boolean = false): number {
  if (isCommercial) {
    return Math.max(fmv * 0.01, 3000);
  }
  return Math.max(fmv * 0.005, 2000);
}

/** Full premium calculation */
export function calculatePremium(params: {
  srp: number;
  srpSource: 'lookup' | 'manual';
  vehicleAge: number;
  bodyType: string;
  sumInsuredOverride?: number;     // optional manual override
  premiumRateOverride?: number;    // optional manual override
  basicPremiumOverride?: number;   // optional manual override
}): PremiumBreakdown {
  const { srp, srpSource, vehicleAge, bodyType } = params;

  // Step 1: Depreciation
  const { fairMarketValue } = calculateDepreciation(srp, vehicleAge);

  // Step 2: Sum insured (FMV or override)
  const sumInsured = params.sumInsuredOverride ?? fairMarketValue;
  const sumInsuredOverride = params.sumInsuredOverride !== undefined;

  // Step 3: Premium rate
  const premiumRate = params.premiumRateOverride ?? getComprehensiveRate(vehicleAge, srp);

  // Step 4: Basic premium
  const basicPremium = params.basicPremiumOverride ?? Math.round(sumInsured * premiumRate);
  const premiumOverride = params.basicPremiumOverride !== undefined || params.premiumRateOverride !== undefined;

  // Step 5: CTPL
  const ctplPremium = getCtplPremium(bodyType);

  // Step 6: Total net premium (basic + CTPL)
  const netPremium = basicPremium + ctplPremium;

  // Step 7: Taxes (applied to net premium)
  const documentaryStamps = Math.round(netPremium * DST_RATE * 100) / 100;
  const vat = Math.round(netPremium * VAT_RATE * 100) / 100;
  const localGovTax = Math.round(netPremium * LGT_RATE * 100) / 100;

  // Step 8: Total
  const totalAmountDue = Math.round((netPremium + documentaryStamps + vat + localGovTax + AUTH_FEES) * 100) / 100;

  // Step 9: Deductible (info only)
  const isCommercial = ['truck', 'pickup'].includes(bodyType);
  const deductible = calculateDeductible(fairMarketValue, isCommercial);

  return {
    vehicleSrp: srp,
    srpSource,
    depreciationYears: vehicleAge,
    fairMarketValue,
    sumInsured,
    sumInsuredOverride,
    premiumRate,
    basicPremium,
    ctplPremium,
    documentaryStamps,
    vat,
    localGovTax,
    authFees: AUTH_FEES,
    totalAmountDue,
    premiumOverride,
    deductible,
  };
}

/** Format peso amount */
export function formatPeso(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Get current year for depreciation calculation */
export function getVehicleAge(yearModel: string | number): number {
  const currentYear = new Date().getFullYear();
  const year = typeof yearModel === 'string' ? parseInt(yearModel, 10) : yearModel;
  if (isNaN(year)) return 0;
  return Math.max(0, currentYear - year);
}
