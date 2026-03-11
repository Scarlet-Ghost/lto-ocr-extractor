"use client";

import { useCallback, useEffect, useState } from "react";
import HistoryTable from "@/components/history-table";
import type { ExtractionRecord } from "@/lib/types";

export default function HistoryPage() {
  const [extractions, setExtractions] = useState<ExtractionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const fetchExtractions = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/extractions");
      if (!res.ok) {
        throw new Error("Failed to fetch extractions.");
      }
      const data = await res.json();
      setExtractions(data.extractions ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchExtractions();
  }, [fetchExtractions]);

  const handleRegenerate = useCallback(
    async (id: string) => {
      setRegeneratingId(id);
      try {
        const res = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ extractionId: id }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? "PDF generation failed.");
        }

        // Refresh the list to show updated PDF status
        await fetchExtractions();
      } catch (err) {
        alert(err instanceof Error ? err.message : "PDF generation failed.");
      } finally {
        setRegeneratingId(null);
      }
    },
    [fetchExtractions]
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark">
          Extraction History
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View all past extractions and re-generate PDFs as needed.
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="h-8 w-8 animate-spin text-primary"
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
            <p className="text-sm font-medium text-gray-500">Loading extractions...</p>
          </div>
        </div>
      ) : error ? (
        /* Error state */
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchExtractions();
            }}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : extractions.length === 0 ? (
        /* Empty state */
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
            No extractions yet.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Upload an OR/CR document from the home page to get started.
          </p>
        </div>
      ) : (
        /* Table */
        <div className="relative">
          {regeneratingId && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-primary"
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
                <span className="text-sm font-medium text-primary">
                  Regenerating PDF...
                </span>
              </div>
            </div>
          )}
          <HistoryTable
            extractions={extractions}
            onRegenerate={handleRegenerate}
          />
        </div>
      )}
    </main>
  );
}
