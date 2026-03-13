"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPeso } from "@/lib/premium-calculator";
import type { Quote, ExtractionData } from "@/lib/types";

interface QuoteWithExtraction extends Quote {
  extractions?: Partial<ExtractionData> & {
    insured_name?: string;
    insured_address?: string;
    plate_no?: string;
    conduction_sticker?: string;
    type_of_body?: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Helper: format date to Philippine locale                           */
/* ------------------------------------------------------------------ */
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Helper: generate quote reference number                            */
/* ------------------------------------------------------------------ */
function quoteRef(q: QuoteWithExtraction): string {
  const d = new Date(q.created_at);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const seq = q.id.slice(0, 6).toUpperCase();
  return `VSO-${yy}${mm}-${seq}`;
}

/* ------------------------------------------------------------------ */
/*  Helper: build a vehicle description string                         */
/* ------------------------------------------------------------------ */
function vehicleDesc(ext: QuoteWithExtraction["extractions"]): string {
  if (!ext) return "\u2014";
  const parts: string[] = [];
  if (ext.year_model) parts.push(ext.year_model);
  if (ext.make) parts.push(ext.make);
  if (ext.model_series) parts.push(ext.model_series);
  if (ext.type_of_body) parts.push(`w/ ${ext.type_of_body}`);
  return parts.join(" ") || "\u2014";
}

/* ------------------------------------------------------------------ */
/*  Status badge colour map                                            */
/* ------------------------------------------------------------------ */
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  quoted: "bg-blue-50 text-blue-700 ring-blue-200",
  viewed: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  issued: "bg-green-50 text-green-800 ring-green-300",
  expired: "bg-amber-50 text-amber-700 ring-amber-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
export default function QuotePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const docRef = useRef<HTMLDivElement>(null);

  const [quote, setQuote] = useState<QuoteWithExtraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /* ---- Fetch ---- */
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

  /* ---- Actions ---- */
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

  const handlePrint = () => window.print();

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-500">Loading quote&hellip;</span>
        </div>
      </main>
    );
  }

  /* ---- Error state ---- */
  if (error || !quote) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-xl border border-red-200 bg-red-50 px-8 py-14 text-center shadow-sm">
          <p className="text-lg font-semibold text-red-700">{error ?? "Quote not found."}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  /* ---- Derived values ---- */
  const ext = quote.extractions;
  const customerLink = quote.quote_token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/q/${quote.quote_token}`
    : null;

  const statusLabel = quote.status.charAt(0).toUpperCase() + quote.status.slice(1);
  const statusClass = STATUS_STYLES[quote.status] ?? STATUS_STYLES.draft;
  const ref = quoteRef(quote);

  /* Coverage defaults */
  const ctplLimit = 200_000;
  const tplBi = 200_000;
  const tplPd = 200_000;
  const pa = 150_000;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <>
      {/* ---- Print stylesheet ---- */}
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-doc { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 40px 48px !important; }
          .min-h-\\[calc\\(100vh-56px\\)\\] { min-height: auto !important; background: white !important; }
        }
      `}</style>

      <main className="mx-auto max-w-4xl px-4 py-8 print:py-0">
        {/* ============================================================ */}
        {/*  ACTION BAR (hidden on print)                                 */}
        {/* ============================================================ */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <span className="text-gray-300">|</span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass}`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendQuote}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              {copied ? "Link Copied!" : "Send to Customer"}
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.122a4.5 4.5 0 00-1.242-7.244l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757" />
              </svg>
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => router.push(`/review/${quote.extraction_id}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit Quote
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.034V3.375" />
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  THE DOCUMENT                                                 */}
        {/* ============================================================ */}
        <div
          ref={docRef}
          className="print-doc mx-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          style={{ maxWidth: 780 }}
        >
          {/* ---- VSO Header ---- */}
          <div className="border-b border-gray-200 px-10 pt-10 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#1E40AF" }}>
                  VSO
                </h1>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500" style={{ marginTop: 2 }}>
                  Insurance Center
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] leading-relaxed text-gray-500">
                  Unit 2101-2102, The Orient Square<br />
                  Emerald Avenue, Ortigas Center<br />
                  Pasig City, Metro Manila
                </p>
                <p className="mt-1 text-[11px] text-gray-500">Tel: (632) 8637-1478</p>
              </div>
            </div>
          </div>

          {/* ---- Quote Info Bar ---- */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-slate-50 px-10 py-3">
            <div className="flex items-center gap-6 text-[12px]">
              <div>
                <span className="font-semibold text-gray-400">Quote No.</span>{" "}
                <span className="font-bold text-gray-800">{ref}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400">Date</span>{" "}
                <span className="font-medium text-gray-700">{fmtDate(quote.created_at)}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-400">Valid Until</span>{" "}
                <span className="font-medium text-gray-700">{fmtDate(quote.expires_at)}</span>
              </div>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusClass}`}>
              {statusLabel}
            </span>
          </div>

          {/* ---- Body ---- */}
          <div className="px-10 py-8 text-[13.5px] leading-relaxed text-gray-700">
            {/* Addressed to */}
            <div className="mb-6">
              <p className="font-semibold text-gray-900">{ext?.insured_name || "\u2014"}</p>
              {ext?.insured_address && (
                <p className="text-gray-500">{ext.insured_address}</p>
              )}
            </div>

            <p className="mb-6">
              Dear <span className="font-semibold">{ext?.insured_name?.split(" ")[0] || "Sir/Madam"}</span>,
            </p>
            <p className="mb-8">
              Thank you for your inquiry. We are pleased to submit our quotation for your vehicle
              insurance coverage as follows:
            </p>

            {/* ---- Vehicle Card ---- */}
            <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50/50 p-5">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Vehicle Details
              </h3>
              <p className="text-base font-bold text-gray-900">
                {vehicleDesc(ext)}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-[12.5px] text-gray-600">
                {ext?.year_model && (
                  <span>Year Model: <strong className="text-gray-800">{ext.year_model}</strong></span>
                )}
                {(ext?.plate_no || ext?.conduction_sticker) && (
                  <span>
                    Plate No: <strong className="text-gray-800">{ext?.plate_no || ext?.conduction_sticker || "\u2014"}</strong>
                  </span>
                )}
                {ext?.color && (
                  <span>Color: <strong className="text-gray-800">{ext.color}</strong></span>
                )}
              </div>
            </div>

            {/* ---- Two-Column: Coverage + Premium ---- */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* LEFT: Coverage Limits */}
              <div className="rounded-lg border border-gray-200 p-5">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Coverage &amp; Limits
                </h3>
                <table className="w-full text-[13px]">
                  <tbody>
                    <CoverageRow label="O/D (Own Damage)" value={quote.sum_insured ? formatPeso(quote.sum_insured) : "\u2014"} />
                    <CoverageRow label="CTPL" value={formatPeso(ctplLimit)} />
                    <CoverageRow label="TPL / BI" value={formatPeso(tplBi)} sub="Third Party Bodily Injury" />
                    <CoverageRow label="TPL / PD" value={formatPeso(tplPd)} sub="Third Party Property Damage" />
                    <CoverageRow label="PA" value={formatPeso(pa)} sub="Personal Accident" />
                  </tbody>
                </table>
                <p className="mt-3 text-[11px] italic text-gray-400">
                  (1 driver / 4 passengers)
                </p>
              </div>

              {/* RIGHT: Premium Breakdown */}
              <div className="rounded-lg border border-gray-200 p-5">
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Premium Breakdown
                </h3>
                <table className="w-full text-[13px]">
                  <tbody>
                    <PremiumRow label="Premium" amount={quote.basic_premium} />
                    <PremiumRow label="CTPL" amount={quote.ctpl_premium} />
                    <PremiumRow label="Doc Stamp" amount={quote.documentary_stamps} />
                    <PremiumRow label="E-VAT" amount={quote.vat} />
                    <PremiumRow label="LGT" amount={quote.local_gov_tax} />
                    <PremiumRow label="Auth Fee" amount={76} />
                    <tr>
                      <td colSpan={2}>
                        <div className="my-2 border-t-2 border-gray-300" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold text-gray-900">Total Amount Due</td>
                      <td className="py-1 text-right text-lg font-extrabold" style={{ color: "#1E40AF" }}>
                        {quote.total_amount_due != null ? formatPeso(quote.total_amount_due) : "\u2014"}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {quote.premium_override && (
                  <p className="mt-2 text-[11px] text-amber-600">* Premium values were manually adjusted</p>
                )}
                {quote.sum_insured_override && (
                  <p className="mt-1 text-[11px] text-amber-600">* Sum insured was manually overridden</p>
                )}
              </div>
            </div>

            {/* ---- Additional Details ---- */}
            <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Additional Details
              </h3>
              <div className="grid grid-cols-1 gap-y-2 text-[13px] sm:grid-cols-2 sm:gap-x-8">
                <DetailLine label="Insurance Company" value="Standard Insurance Co., Inc." />
                <DetailLine label="Coverage Type" value="Comprehensive (OD + Theft + CTPL)" />
                <DetailLine
                  label="Deductible"
                  value={quote.fair_market_value ? formatPeso(Math.max(quote.fair_market_value * 0.005, 2000)) : "\u2014"}
                />
                <DetailLine label="Acts of God" value="With Acts of God" />
                <DetailLine label="Fair Market Value" value={quote.fair_market_value ? formatPeso(quote.fair_market_value) : "\u2014"} />
                <DetailLine
                  label="Vehicle SRP"
                  value={quote.vehicle_srp ? formatPeso(quote.vehicle_srp) : "\u2014"}
                />
              </div>
            </div>

            {/* ---- Closing / Signature ---- */}
            <div className="mb-2">
              <p className="mb-6">
                We hope you find our quotation competitive and look forward to being of service.
                Should you have questions or wish to proceed, please do not hesitate to contact us.
              </p>
              <p className="mb-1">Very truly yours,</p>
              <div className="mt-8">
                <div className="inline-block border-b border-gray-400 pb-0.5">
                  <p className="font-bold text-gray-900">{quote.created_by || "VSO Insurance Center"}</p>
                </div>
                <p className="mt-1 text-[12px] text-gray-500">Account Officer</p>
                <p className="text-[12px] text-gray-500">VSO Insurance Center</p>
              </div>
            </div>
          </div>

          {/* ---- Document Footer ---- */}
          <div className="border-t border-gray-200 bg-slate-50 px-10 py-4 text-center text-[10.5px] text-gray-400">
            <p>
              VSO Insurance Center &bull; Unit 2101-2102, The Orient Square, Emerald Avenue,
              Ortigas Center, Pasig City &bull; Tel: (632) 8637-1478
            </p>
            <p className="mt-0.5">Quote Ref: {ref}</p>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  Customer Link Card (below document, hidden on print)         */}
        {/* ============================================================ */}
        {customerLink && (
          <div className="no-print mx-auto mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" style={{ maxWidth: 780 }}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
                {customerLink}
              </code>
              <button
                onClick={handleCopyLink}
                className="shrink-0 rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="no-print h-12" />
      </main>
    </>
  );
}

/* ================================================================== */
/*  Sub-components (co-located, not worth separate files)              */
/* ================================================================== */

function CoverageRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <tr>
      <td className="py-1.5 pr-2 align-top">
        <span className="font-semibold text-gray-800">{label}</span>
        {sub && <span className="block text-[10.5px] text-gray-400">{sub}</span>}
      </td>
      <td className="py-1.5 text-right font-medium text-gray-700">{value}</td>
    </tr>
  );
}

function PremiumRow({
  label,
  amount,
}: {
  label: string;
  amount: number | null | undefined;
}) {
  return (
    <tr>
      <td className="py-1 text-gray-600">{label}</td>
      <td className="py-1 text-right font-medium text-gray-800">
        {amount != null ? formatPeso(amount) : "\u2014"}
      </td>
    </tr>
  );
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}
