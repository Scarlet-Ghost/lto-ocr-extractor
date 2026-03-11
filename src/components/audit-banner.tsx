"use client";

import { useState } from "react";
import type { AuditFlags } from "@/lib/types";

interface AuditBannerProps {
  auditFlags: AuditFlags;
}

export default function AuditBanner({ auditFlags }: AuditBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const warnings: string[] = [];

  if (auditFlags.is_blurry) {
    warnings.push("Image quality is low");
  }
  if (auditFlags.missing_fields.length > 0) {
    warnings.push(`Missing fields: ${auditFlags.missing_fields.join(", ")}`);
  }
  if (auditFlags.registration_status === "Expired") {
    warnings.push("Registration appears to be expired");
  }

  if (warnings.length === 0 || dismissed) {
    return null;
  }

  return (
    <div className="relative rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-100"
        aria-label="Dismiss warnings"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div className="flex items-start gap-2">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <ul className="space-y-1">
          {warnings.map((warning) => (
            <li key={warning} className="text-sm font-medium text-amber-800">
              {warning}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
