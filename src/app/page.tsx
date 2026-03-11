"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UploadZone from "@/components/upload-zone";
import type { ExtractionRecord } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentExtractions, setRecentExtractions] = useState<ExtractionRecord[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Fetch recent extractions on mount
  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/extractions?limit=5");
        if (res.ok) {
          const data = await res.json();
          setRecentExtractions(data.data ?? data.extractions ?? []);
        }
      } catch {
        // Silently fail — recent extractions are non-critical
      } finally {
        setLoadingRecent(false);
      }
    }
    fetchRecent();
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);
      setStatusMessage("Uploading document...");

      try {
        // Step 1: Upload file
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadErr.error ?? "Upload failed. Please try again.");
        }

        const { fileUrl, fileType } = await uploadRes.json();

        // Step 2: Extract data via OCR
        setStatusMessage("Extracting data from document...");

        const extractRes = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl }),
        });

        if (!extractRes.ok) {
          const extractErr = await extractRes.json().catch(() => ({}));
          throw new Error(extractErr.error ?? "Extraction failed. Please try again.");
        }

        const extractionResult = await extractRes.json();

        // Step 3: Save as draft extraction
        setStatusMessage("Saving extraction...");

        const saveRes = await fetch("/api/extractions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original_file_url: fileUrl,
            original_file_type: fileType ?? file.type,
            ...extractionResult.extracted_data,
            confidence_scores: extractionResult.audit_flags?.field_confidence ?? {},
            audit_flags: extractionResult.audit_flags ?? {},
            status: "draft",
          }),
        });

        if (!saveRes.ok) {
          const saveErr = await saveRes.json().catch(() => ({}));
          throw new Error(saveErr.error ?? "Failed to save extraction.");
        }

        const { id } = await saveRes.json();

        // Step 4: Redirect to review page
        router.push(`/review/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        setIsProcessing(false);
        setStatusMessage(null);
      }
    },
    [router]
  );

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-dark">
          Upload OR/CR Document
        </h1>
        <p className="mt-2 text-gray-500">
          Upload a photo or scan of an LTO OR/CR to extract vehicle and owner data automatically.
        </p>
      </div>

      {/* Upload zone */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <UploadZone onFileSelected={handleFileSelected} isLoading={isProcessing} />

        {/* Status message */}
        {statusMessage && (
          <p className="mt-4 text-center text-sm font-medium text-primary">
            {statusMessage}
          </p>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Recent extractions */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-neutral-dark">
          Recent Extractions
        </h2>

        {loadingRecent ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="h-6 w-6 animate-spin text-primary"
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
          </div>
        ) : recentExtractions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center shadow-sm">
            <p className="text-sm text-gray-400">
              No extractions yet. Upload a document to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Insured Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Plate No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentExtractions.map((record) => (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/review/${record.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {record.insured_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-dark">
                      {record.plate_no ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          record.status === "completed"
                            ? "bg-conf-high-bg text-conf-high-text"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {record.status === "completed" ? "Completed" : "Draft"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-right">
              <Link
                href="/history"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all extractions
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
