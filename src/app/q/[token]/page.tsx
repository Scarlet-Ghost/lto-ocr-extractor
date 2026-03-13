"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function quoteRef(q: QuoteWithExtraction): string {
  const d = new Date(q.created_at);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const seq = q.id.slice(0, 6).toUpperCase();
  return `VSO-${yy}${mm}-${seq}`;
}

function firstName(fullName: string | undefined | null): string {
  if (!fullName) return "Sir/Madam";
  const trimmed = fullName.trim().replace(/,+$/, "");
  if (trimmed.includes(",")) {
    const after = trimmed.split(",")[1]?.trim().split(" ")[0];
    if (after) return after.charAt(0).toUpperCase() + after.slice(1).toLowerCase();
  }
  const first = trimmed.split(" ")[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "Sir/Madam";
}

function vehicleDesc(ext: QuoteWithExtraction["extractions"]): string {
  if (!ext) return "\u2014";
  const parts: string[] = [];
  if (ext.year_model) parts.push(ext.year_model);
  if (ext.make) parts.push(ext.make);
  if (ext.model_series) parts.push(ext.model_series);
  if (ext.type_of_body) parts.push(`w/ ${ext.type_of_body}`);
  return parts.join(" ") || "\u2014";
}

export default function CustomerQuotePage() {
  const params = useParams();
  const token = params.token as string;

  const [quote, setQuote] = useState<QuoteWithExtraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDone, setActionDone] = useState<"approved" | "rejected" | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/token/${token}`);
        if (res.status === 404) throw new Error("Quote not found.");
        if (!res.ok) throw new Error("Failed to load quote.");
        const data = await res.json();
        setQuote(data);
        if (data.status === "approved") setActionDone("approved");
        if (data.status === "rejected") setActionDone("rejected");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading quote.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [token]);

  const handleAction = async (action: "approve" | "reject") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotes/token/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, customer_note: action === "reject" ? rejectNote : undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed.");
      }
      setActionDone(action === "approve" ? "approved" : "rejected");
      if (quote) setQuote({ ...quote, status: action === "approve" ? "approved" : "rejected" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  /* Loading */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-500">Loading quote...</span>
        </div>
      </main>
    );
  }

  /* Error */
  if (error || !quote) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">{error ?? "Quote not found."}</p>
          <p className="mt-2 text-sm text-gray-500">Please contact VSO Insurance Center for assistance.</p>
        </div>
      </main>
    );
  }

  /* Expired */
  if (quote.status === "expired") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-7 w-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">Quote Expired</p>
          <p className="mt-2 text-sm text-gray-500">
            This quote expired on {fmtDate(quote.expires_at)}. Please contact VSO Insurance Center for a new quotation.
          </p>
          <p className="mt-4 text-xs text-gray-400">Tel: (632) 8637-1478</p>
        </div>
      </main>
    );
  }

  const ext = quote.extractions;
  const ref = quoteRef(quote);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Document */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* VSO Header */}
          <div className="border-b border-gray-200 px-8 pt-8 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#1E40AF" }}>VSO</h1>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500" style={{ marginTop: 2 }}>
                  Insurance Center
                </p>
              </div>
              <div className="text-right text-[11px] leading-relaxed text-gray-500">
                <p>Unit 2101-2102, The Orient Square</p>
                <p>Emerald Avenue, Ortigas Center, Pasig City</p>
                <p className="mt-1">Tel: (632) 8637-1478</p>
              </div>
            </div>
          </div>

          {/* Quote Info */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50 px-8 py-2.5">
            <div className="flex items-center gap-5 text-[12px]">
              <div><span className="font-semibold text-gray-400">Ref.</span> <span className="font-bold text-gray-800">{ref}</span></div>
              <div><span className="font-semibold text-gray-400">Date</span> <span className="font-medium text-gray-700">{fmtDate(quote.created_at)}</span></div>
            </div>
            <span className="text-[11px] font-medium text-gray-400">Valid until {fmtDate(quote.expires_at)}</span>
          </div>

          {/* Body */}
          <div className="px-8 py-7 text-[13.5px] leading-relaxed text-gray-700">
            {/* Greeting */}
            <p className="mb-1 font-semibold text-gray-900">{ext?.insured_name || "\u2014"}</p>
            {ext?.insured_address && <p className="mb-5 text-[12.5px] text-gray-500">{ext.insured_address}</p>}

            <p className="mb-6">
              Dear <span className="font-semibold">{firstName(ext?.insured_name)}</span>,
              <br />
              We are pleased to present the following motor insurance quotation for your review:
            </p>

            {/* Vehicle */}
            <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2">Vehicle</p>
              <p className="text-[15px] font-bold text-gray-900">{vehicleDesc(ext)}</p>
              <div className="mt-2 flex flex-wrap gap-x-6 text-[12px] text-gray-600">
                {ext?.plate_no && <span>Plate: <strong className="text-gray-800">{ext.plate_no}</strong></span>}
                {ext?.color && <span>Color: <strong className="text-gray-800">{ext.color}</strong></span>}
              </div>
            </div>

            {/* Two columns */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Coverage */}
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Coverage & Limits</p>
                <table className="w-full text-[13px]">
                  <tbody>
                    <CRow label="O/D (Own Damage)" value={quote.sum_insured ? formatPeso(quote.sum_insured) : "\u2014"} />
                    <CRow label="CTPL" value={formatPeso(200000)} />
                    <CRow label="TPL / BI" value={formatPeso(200000)} />
                    <CRow label="TPL / PD" value={formatPeso(200000)} />
                    <CRow label="PA" value={formatPeso(150000)} />
                  </tbody>
                </table>
                <p className="mt-2 text-[10.5px] italic text-gray-400">(1 driver / 4 passengers)</p>
              </div>

              {/* Premium */}
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Premium</p>
                <table className="w-full text-[13px]">
                  <tbody>
                    <PRow label="Premium" amount={quote.basic_premium} />
                    <PRow label="CTPL" amount={quote.ctpl_premium} />
                    <PRow label="Doc Stamp" amount={quote.documentary_stamps} />
                    <PRow label="E-VAT" amount={quote.vat} />
                    <PRow label="LGT" amount={quote.local_gov_tax} />
                    <PRow label="Auth Fee" amount={76} />
                    <tr><td colSpan={2}><div className="my-2 border-t-2 border-gray-300" /></td></tr>
                    <tr>
                      <td className="py-1 font-bold text-gray-900">Total</td>
                      <td className="py-1 text-right text-lg font-extrabold" style={{ color: "#1E40AF" }}>
                        {quote.total_amount_due != null ? formatPeso(quote.total_amount_due) : "\u2014"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Details */}
            <div className="mb-6 rounded-lg bg-gray-50 border border-gray-200 p-4 text-[12.5px]">
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-6">
                <DLine label="Insurance Co." value="Standard Insurance Co., Inc." />
                <DLine label="Coverage" value="Comprehensive + CTPL" />
                <DLine label="Deductible" value={quote.fair_market_value ? formatPeso(Math.max(quote.fair_market_value * 0.005, 2000)) + " per accident" : "\u2014"} />
                <DLine label="Acts of God" value="Included" />
              </div>
            </div>

            {/* Closing */}
            <p className="text-[12.5px] text-gray-500">
              Should you have questions, contact us at <strong className="text-gray-700">(632) 8637-1478</strong>.
            </p>
          </div>

          {/* Action area */}
          <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
            {actionDone === "approved" ? (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <svg className="h-6 w-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-emerald-800">Quote Approved</p>
                  <p className="text-sm text-emerald-600">Thank you! VSO will prepare your policy and contact you shortly.</p>
                </div>
              </div>
            ) : actionDone === "rejected" ? (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                <svg className="h-6 w-6 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-700">Changes Requested</p>
                  <p className="text-sm text-red-600">VSO will review your feedback and get back to you.</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-sm text-gray-600 font-medium">
                  If you agree with this quotation, please approve below:
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                  >
                    {actionLoading ? "Processing..." : "Approve Quote"}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Request Changes
                  </button>
                </div>

                {showRejectForm && (
                  <div className="mt-4">
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Please let us know what you'd like to change..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleAction("reject")}
                      disabled={actionLoading}
                      className="mt-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Sending..." : "Submit Feedback"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-8 py-3 text-center text-[10px] text-gray-400">
            VSO Insurance Center &bull; Ref: {ref}
          </div>
        </div>
      </div>
    </main>
  );
}

function CRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 pr-2 font-semibold text-gray-800">{label}</td>
      <td className="py-1 text-right font-medium text-gray-700">{value}</td>
    </tr>
  );
}

function PRow({ label, amount }: { label: string; amount: number | null | undefined }) {
  return (
    <tr>
      <td className="py-1 text-gray-600">{label}</td>
      <td className="py-1 text-right font-medium text-gray-800">{amount != null ? formatPeso(amount) : "\u2014"}</td>
    </tr>
  );
}

function DLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}
