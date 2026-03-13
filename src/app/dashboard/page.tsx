"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPeso } from "@/lib/premium-calculator";
import type { Quote, QuoteStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ExtractionSnippet {
  insured_name?: string | null;
  plate_no?: string | null;
  make?: string | null;
  model_series?: string | null;
  year_model?: string | null;
}

interface QuoteRow extends Quote {
  extractions?: ExtractionSnippet | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "quoted", label: "Quoted" },
  { value: "viewed", label: "Viewed" },
  { value: "approved", label: "Approved" },
  { value: "issued", label: "Issued" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  quoted: "bg-blue-50 text-blue-700 ring-blue-200",
  viewed: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  issued: "bg-green-50 text-green-800 ring-green-300",
  expired: "bg-amber-50 text-amber-700 ring-amber-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function vehicleLabel(ext: ExtractionSnippet | null | undefined): string {
  if (!ext) return "\u2014";
  const parts: string[] = [];
  if (ext.make) parts.push(ext.make);
  if (ext.model_series) parts.push(ext.model_series);
  return parts.join(" ") || "\u2014";
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  count,
  colorClass,
  icon,
}: {
  label: string;
  count: number;
  colorClass: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Spinner                                                             */
/* ------------------------------------------------------------------ */

function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-primary ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Actions Dropdown                                                    */
/* ------------------------------------------------------------------ */

function ActionsMenu({
  quote,
  onIssue,
  onResend,
  onCopyLink,
}: {
  quote: QuoteRow;
  onIssue: (id: string) => void;
  onResend: (id: string) => void;
  onCopyLink: (token: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const canIssue = quote.status === "approved";
  const canResend = quote.status === "quoted" || quote.status === "viewed";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        Actions
        <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setOpen(false);
              router.push(`/quote/${quote.id}/preview`);
            }}
          >
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            View Quote
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setOpen(false);
              onCopyLink(quote.quote_token);
            }}
          >
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.122a4.5 4.5 0 00-1.242-7.244l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757" />
            </svg>
            Copy Link
          </button>

          {canResend && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setOpen(false);
                onResend(quote.id);
              }}
            >
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Resend
            </button>
          )}

          {canIssue && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  setOpen(false);
                  onIssue(quote.id);
                }}
              >
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Issue Policy
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Derived stats ----
  const total = pagination.total;

  // We compute stats from the full dataset across all pages by fetching counts.
  // For simplicity, compute from loaded data when no filter is active; we also
  // expose a separate lightweight count fetch.
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    issued: 0,
    expired: 0,
  });

  // ---- Fetch quotes ----
  const fetchQuotes = useCallback(
    async (page: number, status: string, q: string) => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (status) params.set("status", status);
        if (q) params.set("search", q);

        const res = await fetch(`/api/quotes?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch quotes.");
        const json = await res.json();
        setQuotes(json.data ?? []);
        setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ---- Fetch all-status counts (for stats bar) ----
  const fetchStats = useCallback(async () => {
    try {
      // Fetch totals for each bucket in parallel (lightweight, limit=1 each)
      const [all, approved, issued, expired] = await Promise.all([
        fetch("/api/quotes?limit=1").then((r) => r.json()),
        fetch("/api/quotes?limit=1&status=approved").then((r) => r.json()),
        fetch("/api/quotes?limit=1&status=issued").then((r) => r.json()),
        fetch("/api/quotes?limit=1&status=expired").then((r) => r.json()),
      ]);

      const totalCount = all.pagination?.total ?? 0;
      const approvedCount = approved.pagination?.total ?? 0;
      const issuedCount = issued.pagination?.total ?? 0;
      const expiredCount = expired.pagination?.total ?? 0;
      // Pending = total - approved - issued - expired
      const pendingCount = Math.max(0, totalCount - approvedCount - issuedCount - expiredCount);

      setStats({
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        issued: issuedCount,
        expired: expiredCount,
      });
    } catch {
      // Stats are non-critical; fail silently
    }
  }, []);

  // ---- Mount ----
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchQuotes(1, statusFilter, search);
  }, [fetchQuotes, statusFilter, search]);

  // ---- Debounce search ----
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value.trim());
    }, 300);
  };

  // ---- Pagination ----
  const goToPage = (page: number) => {
    fetchQuotes(page, statusFilter, search);
  };

  // ---- Copy link ----
  const handleCopyLink = (token: string | null) => {
    if (!token) return;
    const link = `${window.location.origin}/q/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ---- Issue policy ----
  const handleIssue = async (id: string) => {
    if (!window.confirm("Issue this policy? This action cannot be undone.")) return;
    setIssuingId(id);
    try {
      const res = await fetch(`/api/quotes/${id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "Failed to issue policy.");
      }
      // Refresh list and stats
      await Promise.all([
        fetchQuotes(pagination.page, statusFilter, search),
        fetchStats(),
      ]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to issue policy.");
    } finally {
      setIssuingId(null);
    }
  };

  // ---- Resend ----
  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "quoted" }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? "Failed to resend.");
      }
      // Update local quote status optimistically
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, status: "quoted" as QuoteStatus } : q
        )
      );
      // Find the quote token and copy link
      const q = quotes.find((q) => q.id === id);
      if (q?.quote_token) handleCopyLink(q.quote_token);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resend.");
    } finally {
      setResendingId(null);
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* ---- Header ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Manage quotes and policies</p>
      </div>

      {/* ---- Stats Bar ---- */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Quotes"
          count={stats.total}
          colorClass="bg-gray-100"
          icon={
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          count={stats.pending}
          colorClass="bg-blue-100"
          icon={
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Approved"
          count={stats.approved}
          colorClass="bg-emerald-100"
          icon={
            <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Issued"
          count={stats.issued}
          colorClass="bg-green-100"
          icon={
            <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <StatCard
          label="Expired"
          count={stats.expired}
          colorClass="bg-amber-100"
          icon={
            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      {/* ---- Filters Row ---- */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by customer name or plate no..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {(statusFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setSearchInput("");
              setSearch("");
            }}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ---- Table ---- */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-8 w-8" />
            <p className="text-sm font-medium text-gray-500">Loading quotes...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => fetchQuotes(pagination.page, statusFilter, search)}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : quotes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">
            {statusFilter || search ? "No quotes match your filters." : "No quotes yet."}
          </p>
          {!statusFilter && !search && (
            <p className="mt-1 text-xs text-gray-400">
              Upload an OR/CR document and create a quote to get started.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Overlay spinner for issue/resend actions */}
          <div className="relative">
            {(issuingId || resendingId) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
                <div className="flex items-center gap-2">
                  <Spinner className="h-5 w-5" />
                  <span className="text-sm font-medium text-primary">
                    {issuingId ? "Issuing policy..." : "Resending..."}
                  </span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Plate No
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Sum Insured
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Premium
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotes.map((quote) => {
                    const ext = quote.extractions;
                    const statusClass =
                      STATUS_STYLES[quote.status] ?? STATUS_STYLES.draft;
                    const statusLabel =
                      quote.status.charAt(0).toUpperCase() +
                      quote.status.slice(1);

                    return (
                      <tr
                        key={quote.id}
                        className="group transition-colors hover:bg-blue-50/30"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {ext?.insured_name || (
                            <span className="text-gray-400">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {vehicleLabel(ext)}
                        </td>
                        <td className="px-4 py-3">
                          {ext?.plate_no ? (
                            <span className="font-mono text-xs font-semibold text-gray-700">
                              {ext.plate_no}
                            </span>
                          ) : (
                            <span className="text-gray-400">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {quote.sum_insured != null ? (
                            formatPeso(quote.sum_insured)
                          ) : (
                            <span className="text-gray-400">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {quote.total_amount_due != null ? (
                            formatPeso(quote.total_amount_due)
                          ) : (
                            <span className="text-gray-400">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {fmtDate(quote.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ActionsMenu
                            quote={quote}
                            onIssue={handleIssue}
                            onResend={handleResend}
                            onCopyLink={handleCopyLink}
                          />
                          {copiedId === quote.quote_token && (
                            <span className="ml-2 text-xs font-medium text-emerald-600">
                              Copied!
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---- Pagination ---- */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {(pagination.page - 1) * pagination.limit + 1}
                  {" \u2013 "}
                  {Math.min(pagination.page * pagination.limit, total)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">{total}</span>{" "}
                quotes
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => goToPage(pagination.page + 1)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
