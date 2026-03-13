"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExtractionData, PremiumBreakdown, VehicleSrp } from "@/lib/types";
import {
  calculatePremium,
  calculateDepreciation,
  getVehicleAge,
  formatPeso,
} from "@/lib/premium-calculator";
import SrpLookup from "./srp-lookup";

interface ValuationFormProps {
  extractionData: ExtractionData;
  extractionId: string;
  onQuoteGenerated: (quoteId: string) => void;
}

interface FormState {
  // Valuation
  srp: number | null;
  srpSource: "lookup" | "manual";
  vehicleInfo: VehicleSrp | null;
  fmvOverride: number | null;
  sumInsuredOverride: number | null;

  // Premium overrides
  premiumRateOverride: number | null;
  basicPremiumOverride: number | null;

  // Track which fields were manually touched
  fmvTouched: boolean;
  sumInsuredTouched: boolean;
  premiumRateTouched: boolean;
  basicPremiumTouched: boolean;
}

const INITIAL_FORM: FormState = {
  srp: null,
  srpSource: "lookup",
  vehicleInfo: null,
  fmvOverride: null,
  sumInsuredOverride: null,
  premiumRateOverride: null,
  basicPremiumOverride: null,
  fmvTouched: false,
  sumInsuredTouched: false,
  premiumRateTouched: false,
  basicPremiumTouched: false,
};

/** Normalize type_of_body to a CTPL category key */
function normalizeBodyType(typeOfBody: string): string {
  const t = (typeOfBody ?? "").toLowerCase();
  if (t.includes("sedan")) return "sedan";
  if (t.includes("hatchback")) return "hatchback";
  if (t.includes("suv") || t.includes("sport utility")) return "suv";
  if (t.includes("mpv") || t.includes("van")) return "van";
  if (t.includes("pickup")) return "pickup";
  if (t.includes("truck")) return "truck";
  return "sedan"; // default
}

export default function ValuationForm({
  extractionData,
  extractionId,
  onQuoteGenerated,
}: ValuationFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [breakdown, setBreakdown] = useState<PremiumBreakdown | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const vehicleAge = getVehicleAge(extractionData.year_model ?? "");
  const currentYear = new Date().getFullYear();
  const bodyType = normalizeBodyType(extractionData.type_of_body ?? "");

  // Recompute breakdown whenever form inputs change
  const recompute = useCallback(
    (f: FormState) => {
      if (!f.srp) {
        setBreakdown(null);
        return;
      }

      const result = calculatePremium({
        srp: f.srp,
        srpSource: f.srpSource,
        vehicleAge,
        bodyType,
        sumInsuredOverride: f.sumInsuredOverride ?? undefined,
        premiumRateOverride: f.premiumRateOverride ?? undefined,
        basicPremiumOverride: f.basicPremiumOverride ?? undefined,
      });

      // Apply FMV override (recalculate sum insured if not independently overridden)
      if (f.fmvOverride !== null) {
        result.fairMarketValue = f.fmvOverride;
        if (!f.sumInsuredTouched) {
          result.sumInsured = f.fmvOverride;
        }
      }

      setBreakdown(result);
    },
    [vehicleAge, bodyType]
  );

  useEffect(() => {
    recompute(form);
  }, [form, recompute]);

  // SRP selected from lookup or manual input
  const handleSrpSelect = useCallback(
    (srp: number, source: "lookup" | "manual", vehicleInfo?: VehicleSrp) => {
      setForm((prev) => {
        const next: FormState = {
          ...prev,
          srp,
          srpSource: source,
          vehicleInfo: vehicleInfo ?? null,
          // Reset overrides when SRP changes (unless already manually touched)
          fmvOverride: prev.fmvTouched ? prev.fmvOverride : null,
          sumInsuredOverride: prev.sumInsuredTouched
            ? prev.sumInsuredOverride
            : null,
          premiumRateOverride: prev.premiumRateTouched
            ? prev.premiumRateOverride
            : null,
          basicPremiumOverride: prev.basicPremiumTouched
            ? prev.basicPremiumOverride
            : null,
        };
        return next;
      });
    },
    []
  );

  const handleFmvChange = useCallback((value: string) => {
    const parsed = parseFloat(value.replace(/,/g, ""));
    setForm((prev) => ({
      ...prev,
      fmvOverride: isNaN(parsed) ? null : parsed,
      fmvTouched: true,
    }));
  }, []);

  const handleSumInsuredChange = useCallback((value: string) => {
    const parsed = parseFloat(value.replace(/,/g, ""));
    setForm((prev) => ({
      ...prev,
      sumInsuredOverride: isNaN(parsed) ? null : parsed,
      sumInsuredTouched: true,
    }));
  }, []);

  const handlePremiumRateChange = useCallback((value: string) => {
    const parsed = parseFloat(value);
    // Convert % to decimal if > 1
    const rate = !isNaN(parsed) ? (parsed > 1 ? parsed / 100 : parsed) : null;
    setForm((prev) => ({
      ...prev,
      premiumRateOverride: rate,
      premiumRateTouched: true,
    }));
  }, []);

  const handleBasicPremiumChange = useCallback((value: string) => {
    const parsed = parseFloat(value.replace(/,/g, ""));
    setForm((prev) => ({
      ...prev,
      basicPremiumOverride: isNaN(parsed) ? null : parsed,
      basicPremiumTouched: true,
    }));
  }, []);

  const resetFmv = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      fmvOverride: null,
      fmvTouched: false,
    }));
  }, []);

  const resetSumInsured = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      sumInsuredOverride: null,
      sumInsuredTouched: false,
    }));
  }, []);

  const resetPremiumRate = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      premiumRateOverride: null,
      premiumRateTouched: false,
    }));
  }, []);

  const resetBasicPremium = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      basicPremiumOverride: null,
      basicPremiumTouched: false,
    }));
  }, []);

  const handleGenerateQuote = useCallback(async () => {
    if (!breakdown) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const body = {
        extraction_id: extractionId,
        vehicle_srp: breakdown.vehicleSrp,
        srp_source: breakdown.srpSource,
        depreciation_years: breakdown.depreciationYears,
        depreciation_rate:
          breakdown.vehicleSrp > 0
            ? ((breakdown.vehicleSrp - breakdown.fairMarketValue) /
                breakdown.vehicleSrp) *
              100
            : 0,
        fair_market_value: breakdown.fairMarketValue,
        sum_insured: breakdown.sumInsured,
        sum_insured_override: breakdown.sumInsuredOverride,
        premium_rate: breakdown.premiumRate,
        basic_premium: breakdown.basicPremium,
        ctpl_premium: breakdown.ctplPremium,
        documentary_stamps: breakdown.documentaryStamps,
        vat: breakdown.vat,
        local_gov_tax: breakdown.localGovTax,
        total_amount_due: breakdown.totalAmountDue,
        premium_override: breakdown.premiumOverride,
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create quote.");
      }

      const data = await res.json();
      onQuoteGenerated(data.id);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [breakdown, extractionId, onQuoteGenerated]);

  // Computed display values
  const displayFmv =
    form.fmvOverride !== null
      ? form.fmvOverride
      : breakdown?.fairMarketValue ?? null;

  const displaySumInsured =
    form.sumInsuredOverride !== null
      ? form.sumInsuredOverride
      : displayFmv;

  const depreciationResult =
    form.srp && !form.fmvTouched
      ? calculateDepreciation(form.srp, vehicleAge)
      : null;

  const depreciationPercent =
    form.fmvTouched && form.srp && form.fmvOverride !== null
      ? Math.round(((form.srp - form.fmvOverride) / form.srp) * 10000) / 100
      : depreciationResult?.depreciationPercent ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Section 1: Vehicle Valuation ── */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-neutral-dark">
            Vehicle Valuation
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* SRP Lookup */}
          <div className="px-5 py-4">
            <SrpLookup
              onSelect={handleSrpSelect}
              defaultMake={extractionData.make}
              defaultModel={extractionData.model_series}
            />
          </div>

          {/* Year Model (read-only) */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">Year Model</span>
            <span className="text-sm font-medium text-neutral-dark">
              {extractionData.year_model || "—"}
            </span>
          </div>

          {/* Vehicle Age (auto) */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">Vehicle Age</span>
            <span className="text-sm font-medium text-neutral-dark">
              {extractionData.year_model
                ? `${vehicleAge} year${vehicleAge !== 1 ? "s" : ""} (${currentYear})`
                : "—"}
            </span>
          </div>

          {/* Depreciation (auto) */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">Depreciation</span>
            <span className="text-sm font-medium text-neutral-dark">
              {form.srp ? `${depreciationPercent.toFixed(2)}%` : "—"}
            </span>
          </div>

          {/* Fair Market Value (auto, editable) */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">Fair Market Value</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                  ₱
                </span>
                <input
                  type="text"
                  value={
                    form.fmvTouched && form.fmvOverride !== null
                      ? form.fmvOverride.toString()
                      : (breakdown?.fairMarketValue?.toString() ?? "")
                  }
                  onChange={(e) => handleFmvChange(e.target.value)}
                  placeholder={form.srp ? "Auto-calculated" : "—"}
                  disabled={!form.srp}
                  className="w-full rounded-md border border-gray-200 py-1.5 pl-7 pr-3 text-sm text-neutral-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              {form.fmvTouched && (
                <>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Override
                  </span>
                  <button
                    type="button"
                    onClick={resetFmv}
                    className="text-xs text-gray-400 underline hover:text-gray-600"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sum Insured (defaults to FMV, editable) */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">Sum Insured</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                  ₱
                </span>
                <input
                  type="text"
                  value={
                    form.sumInsuredTouched && form.sumInsuredOverride !== null
                      ? form.sumInsuredOverride.toString()
                      : (displaySumInsured?.toString() ?? "")
                  }
                  onChange={(e) => handleSumInsuredChange(e.target.value)}
                  placeholder={form.srp ? "Defaults to FMV" : "—"}
                  disabled={!form.srp}
                  className="w-full rounded-md border border-gray-200 py-1.5 pl-7 pr-3 text-sm text-neutral-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              {form.sumInsuredTouched && (
                <>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Override
                  </span>
                  <button
                    type="button"
                    onClick={resetSumInsured}
                    className="text-xs text-gray-400 underline hover:text-gray-600"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Premium Breakdown ── */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-neutral-dark">
            Premium Breakdown
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Premium Rate */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">Premium Rate %</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={
                    form.premiumRateTouched && form.premiumRateOverride !== null
                      ? (form.premiumRateOverride * 100).toFixed(4)
                      : (breakdown?.premiumRate
                          ? (breakdown.premiumRate * 100).toFixed(4)
                          : "")
                  }
                  onChange={(e) => handlePremiumRateChange(e.target.value)}
                  placeholder={form.srp ? "Auto" : "—"}
                  disabled={!form.srp}
                  className="w-full rounded-md border border-gray-200 py-1.5 px-3 text-sm text-neutral-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">
                  %
                </span>
              </div>
              {form.premiumRateTouched && (
                <>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Override
                  </span>
                  <button
                    type="button"
                    onClick={resetPremiumRate}
                    className="text-xs text-gray-400 underline hover:text-gray-600"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Basic Premium */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">Basic Premium</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                  ₱
                </span>
                <input
                  type="text"
                  value={
                    form.basicPremiumTouched &&
                    form.basicPremiumOverride !== null
                      ? form.basicPremiumOverride.toString()
                      : (breakdown?.basicPremium?.toString() ?? "")
                  }
                  onChange={(e) => handleBasicPremiumChange(e.target.value)}
                  placeholder={form.srp ? "Auto" : "—"}
                  disabled={!form.srp}
                  className="w-full rounded-md border border-gray-200 py-1.5 pl-7 pr-3 text-sm text-neutral-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              {form.basicPremiumTouched && (
                <>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Override
                  </span>
                  <button
                    type="button"
                    onClick={resetBasicPremium}
                    className="text-xs text-gray-400 underline hover:text-gray-600"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* CTPL Premium (info, not editable) */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">CTPL Premium</span>
            <span className="text-sm text-neutral-dark">
              {breakdown ? formatPeso(breakdown.ctplPremium) : "—"}
            </span>
          </div>

          {/* Documentary Stamps */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">
              Doc. Stamps (12.5%)
            </span>
            <span className="text-sm text-neutral-dark">
              {breakdown ? formatPeso(breakdown.documentaryStamps) : "—"}
            </span>
          </div>

          {/* VAT */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">VAT (12%)</span>
            <span className="text-sm text-neutral-dark">
              {breakdown ? formatPeso(breakdown.vat) : "—"}
            </span>
          </div>

          {/* Local Gov't Tax */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">
              Local Gov&apos;t Tax (0.15%)
            </span>
            <span className="text-sm text-neutral-dark">
              {breakdown ? formatPeso(breakdown.localGovTax) : "—"}
            </span>
          </div>

          {/* Auth Fees */}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3 px-5 py-3">
            <span className="text-sm text-gray-500">Auth Fees</span>
            <span className="text-sm text-neutral-dark">
              {breakdown ? formatPeso(breakdown.authFees) : "—"}
            </span>
          </div>

          {/* Divider + Total */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between rounded-md bg-primary/5 px-4 py-3">
              <span className="text-base font-semibold text-neutral-dark">
                Total Amount Due
              </span>
              <span className="text-xl font-bold text-primary">
                {breakdown ? formatPeso(breakdown.totalAmountDue) : "—"}
              </span>
            </div>

            {/* Deductible info */}
            {breakdown && (
              <p className="mt-2 text-xs text-gray-400">
                Deductible (not included):{" "}
                <span className="font-medium text-gray-600">
                  {formatPeso(breakdown.deductible)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Generate Quote Button ── */}
      {submitError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerateQuote}
        disabled={!breakdown || isSubmitting}
        className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generating Quote…
          </span>
        ) : (
          "Generate Quote"
        )}
      </button>

      {!form.srp && (
        <p className="text-center text-xs text-gray-400">
          Search or enter the vehicle SRP above to enable quote generation.
        </p>
      )}
    </div>
  );
}
