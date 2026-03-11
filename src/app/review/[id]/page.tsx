"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuditBanner from "@/components/audit-banner";
import ExtractionForm from "@/components/extraction-form";
import PdfImage from "@/components/pdf-image";
import type {
  ExtractionRecord,
  ExtractionData,
  AuditFlags,
  ConfidenceScores,
} from "@/lib/types";

function extractFormData(record: ExtractionRecord): ExtractionData {
  return {
    insured_name: record.insured_name,
    insured_address: record.insured_address,
    mv_file_no: record.mv_file_no ?? "",
    plate_no: record.plate_no ?? "",
    conduction_sticker: record.conduction_sticker ?? "",
    make: record.make,
    model_series: record.model_series,
    year_model: record.year_model ?? "",
    type_of_body: record.type_of_body ?? "",
    serial_chassis_no: record.serial_chassis_no,
    motor_no: record.motor_no,
    capacity: record.capacity ?? "",
    unladen_weight: record.unladen_weight ?? "",
    color: record.color ?? "",
    registration_date: record.registration_date ?? "",
  };
}

function isImageType(fileType: string): boolean {
  return (
    fileType.startsWith("image/") ||
    fileType === "jpeg" ||
    fileType === "png" ||
    fileType === "jpg"
  );
}

function isPdfType(fileType: string): boolean {
  return fileType === "application/pdf" || fileType === "pdf";
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<ExtractionRecord | null>(null);
  const [formData, setFormData] = useState<ExtractionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ url: string; type: string }[]>([]);

  // Fetch extraction record on mount
  useEffect(() => {
    async function fetchExtraction() {
      try {
        const res = await fetch(`/api/extractions/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Extraction not found.");
          }
          throw new Error("Failed to load extraction data.");
        }
        const data: ExtractionRecord = await res.json();
        setRecord(data);
        setFormData(extractFormData(data));
        if (data.pdf_url) {
          setPdfUrl(data.pdf_url);
        }

        // Parse file URLs — may be JSON array or single URL
        if (data.original_file_url) {
          let urls: string[] = [];
          try {
            const parsed = JSON.parse(data.original_file_url);
            urls = Array.isArray(parsed) ? parsed : [data.original_file_url];
          } catch {
            urls = [data.original_file_url];
          }

          // Use proxy URLs to avoid CORS issues
          const proxyResults: { url: string; type: string }[] = urls.map((fileUrl) => {
            // Strip query parameters before detecting extension
            // (signed URLs have ?token=... which breaks .split(".").pop())
            const pathname = new URL(fileUrl, "http://localhost").pathname;
            const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
            const type = ext === "pdf" ? "pdf" : "image";
            const proxyUrl = `/api/storage/proxy?url=${encodeURIComponent(fileUrl)}`;
            return { url: proxyUrl, type };
          });
          setPreviewUrls(proxyResults);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchExtraction();
  }, [id]);

  const handleDataChange = useCallback((data: ExtractionData) => {
    setFormData(data);
  }, []);

  const handleGeneratePdf = useCallback(async () => {
    if (!formData) return;

    setGeneratingPdf(true);
    setPdfError(null);

    try {
      // Save updated data first
      const saveRes = await fetch(`/api/extractions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "completed",
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save changes.");
      }

      // Generate PDF
      const pdfRes = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractionId: id }),
      });

      if (!pdfRes.ok) {
        const pdfErr = await pdfRes.json().catch(() => ({}));
        throw new Error(pdfErr.error ?? "PDF generation failed.");
      }

      const { pdfUrl: url } = await pdfRes.json();
      setPdfUrl(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setGeneratingPdf(false);
    }
  }, [formData, id]);

  const handleStartOver = useCallback(() => {
    if (window.confirm("Are you sure you want to start over? Any unsaved changes will be lost.")) {
      router.push("/");
    }
  }, [router]);

  const handlePrint = useCallback(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl]);

  // Loading state
  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
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
            <p className="text-sm font-medium text-gray-500">Loading extraction...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !record || !formData) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-red-700">
            {error ?? "Extraction data unavailable."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            Back to Upload
          </button>
        </div>
      </main>
    );
  }

  const auditFlags: AuditFlags = record.audit_flags ?? {
    is_blurry: false,
    missing_fields: [],
    registration_status: "Unknown" as const,
    field_confidence: {},
  };

  const confidenceScores: ConfidenceScores = record.confidence_scores ?? {};

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">
            Review Extraction
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Verify and edit the extracted data, then generate the PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartOver}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Start Over
        </button>
      </div>

      {/* Audit banner */}
      <div className="mb-6">
        <AuditBanner auditFlags={auditFlags} />
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left panel: Document preview */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Original Document
          </h2>
          <div className="flex items-center justify-center overflow-hidden rounded-md bg-gray-50">
            {previewUrls.length > 0 ? (
              <div className="space-y-4">
                {previewUrls.map((preview, i) => (
                  <div key={i}>
                    {previewUrls.length > 1 && (
                      <p className="mb-1 text-xs font-medium text-gray-400">
                        Document {i + 1}
                      </p>
                    )}
                    {preview.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview.url}
                        alt={`Document ${i + 1}`}
                        className="w-full rounded-md object-contain"
                      />
                    ) : (
                      <PdfImage
                        url={preview.url}
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                Loading preview...
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Extraction form */}
        <div>
          <ExtractionForm
            data={formData}
            confidenceScores={confidenceScores}
            onDataChange={handleDataChange}
          />
        </div>
      </div>

      {/* Bottom actions */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Generate PDF button */}
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={generatingPdf}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generatingPdf ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
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
                Generating PDF...
              </>
            ) : (
              "Generate PDF"
            )}
          </button>

          {/* PDF success actions */}
          {pdfUrl && (
            <>
              <a
                href={pdfUrl}
                download
                className="inline-flex items-center gap-2 rounded-md border border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/5"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </a>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                New Extraction
              </button>
            </>
          )}
        </div>

        {/* PDF error */}
        {pdfError && (
          <p className="mt-3 text-sm font-medium text-red-600">{pdfError}</p>
        )}

        {/* PDF success message */}
        {pdfUrl && !pdfError && (
          <p className="mt-3 text-sm font-medium text-green-600">
            PDF generated successfully.
          </p>
        )}
      </div>
    </main>
  );
}
