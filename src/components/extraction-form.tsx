"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ExtractionData, ConfidenceScores } from "@/lib/types";
import ConfidenceBadge from "./confidence-badge";

const FIELD_LABELS: Record<keyof ExtractionData, string> = {
  insured_name: "Insured Name",
  insured_address: "Insured Address",
  mv_file_no: "M.V. File No.",
  plate_no: "Plate No.",
  conduction_sticker: "Conduction Sticker",
  make: "Make",
  model_series: "Model/Series",
  year_model: "Year Model",
  type_of_body: "Type of Body",
  serial_chassis_no: "Serial/Chassis No.",
  motor_no: "Motor No.",
  capacity: "Authorized Capacity",
  unladen_weight: "Unladen Weight",
  color: "Color",
  registration_date: "Registration Date",
};

interface ExtractionFormProps {
  data: ExtractionData;
  confidenceScores: ConfidenceScores;
  onDataChange: (data: ExtractionData) => void;
}

export default function ExtractionForm({
  data,
  confidenceScores,
  onDataChange,
}: ExtractionFormProps) {
  const originalData = useRef(data);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  const handleFieldChange = useCallback(
    (field: keyof ExtractionData, value: string) => {
      setEditedFields((prev) => new Set(prev).add(field));
      onDataChange({ ...data, [field]: value });
    },
    [data, onDataChange]
  );

  const handleReset = useCallback(() => {
    setEditedFields(new Set());
    onDataChange(originalData.current);
  }, [onDataChange]);

  const fields = useMemo(
    () =>
      (Object.keys(FIELD_LABELS) as (keyof ExtractionData)[]).filter(
        (key) => key in data
      ),
    [data]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-dark">
          Extracted Fields
        </h2>
        {editedFields.size > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Reset to Original
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
        {fields.map((field) => {
          const score = confidenceScores[field] ?? 0;
          const isEdited = editedFields.has(field);
          const isLowConfidence = score < 70 && !isEdited;

          return (
            <div
              key={field}
              className={`grid grid-cols-[140px_1fr_90px] items-center gap-3 px-4 py-3 ${
                isLowConfidence ? "bg-red-50/50" : ""
              }`}
            >
              <label
                htmlFor={`field-${field}`}
                className="text-sm font-medium text-gray-600"
              >
                {FIELD_LABELS[field]}
              </label>
              <input
                id={`field-${field}`}
                type="text"
                value={data[field] ?? ""}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className={`rounded-md border px-3 py-1.5 text-sm text-neutral-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                  isLowConfidence
                    ? "border-red-300"
                    : isEdited
                      ? "border-green-300"
                      : "border-gray-200"
                }`}
              />
              <div className="flex justify-end">
                <ConfidenceBadge score={score} verified={isEdited} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
