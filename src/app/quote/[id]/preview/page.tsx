"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPeso } from "@/lib/premium-calculator";
import type { Quote, ExtractionData } from "@/lib/types";

interface QuoteWithExtraction extends Quote {
  extractions?: Partial<ExtractionData> & { insured_name?: string; plate_no?: string };
}

export default function QuotePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<QuoteWithExtraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/${id}`);
        if (!res.ok) throw new Error("Failed to load quote.");
        const data = await res.json();
        setQuote(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading quote.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [id]);

  const handleCopyLink = () => {
    if (!quote?.quote_token) return;
    const link = `${window.location.origin}/q/${quote.quote_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendQuote = async () => {
    try {
      await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "quoted" }),
      });
      if (quote) setQuote({ ...quote, status: "quoted" as const });
      handleCopyLink();
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </main>
    );
  }

  if (error || !quote) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-red-700">{error ?? "Quote not found."}</p>
          <button onClick={() => router.push("/")} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const ext = quote.extractions;
  const customerLink = quote.quote_token ? `${typeof window !== "undefined" ? window.location.origin : ""}/q/${quote.quote_token}` : null;

  const row = (label: string, value: string | number | null | undefined, bold = false) => (
    <div className={`flex items-center justify-between py-2 ${bold ? "border-t-2 border-gray-300 pt-3 mt-1" : "border-t border-gray-100"}`}>
      <span className={`text-sm ${bold ? "font-bold text-neutral-dark" : "text-gray-600"}`}>{label}</span>
      <span className={`text-sm ${bold ? "text-lg font-bold text-primary" : "font-medium text-neutral-dark"}`}>
        {value != null ? (typeof value === "number" ? formatPeso(value) : value) : "—"}
      </span>
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">Quote Preview</h1>
          <p className="mt-1 text-sm text-gray-500">Review the quote before sending to customer.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            quote.status === "draft" ? "bg-gray-100 text-gray-600" :
            quote.status === "quoted" ? "bg-blue-100 text-blue-700" :
            quote.status === "approved" ? "bg-green-100 text-green-700" :
            quote.status === "issued" ? "bg-emerald-100 text-emerald-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Vehicle & Insured</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {row("Insured Name", ext?.insured_name)}
          {row("Plate No.", ext?.plate_no)}
          {row("Make / Model", ext ? `${ext.make ?? ""} ${ext.model_series ?? ""}`.trim() : "—")}
          {row("Year Model", ext?.year_model)}
        </div>
      </div>

      {/* Valuation */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Vehicle Valuation</h2>
        {row("Vehicle SRP", quote.vehicle_srp)}
        {row("Depreciation", quote.depreciation_years != null ? `${quote.depreciation_years} year(s)` : "—")}
        {row("Fair Market Value", quote.fair_market_value)}
        {row("Sum Insured", quote.sum_insured)}
        {quote.sum_insured_override && (
          <p className="mt-1 text-xs text-amber-600">* Sum insured was manually overridden</p>
        )}
      </div>

      {/* Premium Breakdown */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Premium Breakdown</h2>
        {row("Premium Rate", quote.premium_rate != null ? `${(quote.premium_rate * 100).toFixed(2)}%` : "—")}
        {row("Basic Premium", quote.basic_premium)}
        {row("CTPL Premium", quote.ctpl_premium)}
        {row("Documentary Stamps (12.5%)", quote.documentary_stamps)}
        {row("VAT (12%)", quote.vat)}
        {row("Local Gov't Tax (0.15%)", quote.local_gov_tax)}
        {row("Auth Fees", 76)}
        {row("Total Amount Due", quote.total_amount_due, true)}
        {quote.premium_override && (
          <p className="mt-1 text-xs text-amber-600">* Premium values were manually adjusted</p>
        )}
      </div>

      {/* Coverage */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Coverage</h2>
        {row("Type", "Comprehensive (Own Damage + Theft + CTPL)")}
        {row("CTPL Liability Limit", "PHP 200,000.00")}
        {row("Quote Valid Until", quote.expires_at ? new Date(quote.expires_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—")}
      </div>

      {/* Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSendQuote}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            {copied ? "Link Copied!" : "Send to Customer"}
          </button>

          <button
            onClick={() => router.push(`/review/${quote.extraction_id}`)}
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Edit Quote
          </button>

          <button
            onClick={() => router.push("/")}
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            New Extraction
          </button>
        </div>

        {customerLink && (
          <div className="mt-4 rounded-md bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">Customer Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-white px-3 py-1.5 text-xs text-gray-700 border border-gray-200">
                {customerLink}
              </code>
              <button
                onClick={handleCopyLink}
                className="shrink-0 rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
