"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VehicleSrp } from "@/lib/types";
import { formatPeso } from "@/lib/premium-calculator";

interface SrpLookupProps {
  onSelect: (
    srp: number,
    source: "lookup" | "manual",
    vehicleInfo?: VehicleSrp
  ) => void;
  defaultMake?: string;
  defaultModel?: string;
}

export default function SrpLookup({
  onSelect,
  defaultMake,
  defaultModel,
}: SrpLookupProps) {
  const [mode, setMode] = useState<"lookup" | "manual">("lookup");
  const [query, setQuery] = useState(
    [defaultMake, defaultModel].filter(Boolean).join(" ")
  );
  const [results, setResults] = useState<VehicleSrp[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<VehicleSrp | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search when query changes (debounced 300ms)
  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/vehicle-srps?q=${encodeURIComponent(term.trim())}`
      );
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      setResults(json.data ?? []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      setSelected(null);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val), 300);
    },
    [doSearch]
  );

  const handleSelect = useCallback(
    (srp: VehicleSrp) => {
      setSelected(srp);
      setQuery(
        [srp.make, srp.model, srp.variant].filter(Boolean).join(" ")
      );
      setIsOpen(false);
      onSelect(srp.srp, "lookup", srp);
    },
    [onSelect]
  );

  const handleManualSubmit = useCallback(() => {
    const val = parseFloat(manualValue.replace(/,/g, ""));
    if (isNaN(val) || val <= 0) {
      setManualError("Please enter a valid positive amount.");
      return;
    }
    setManualError(null);
    onSelect(val, "manual");
  }, [manualValue, onSelect]);

  // Auto-search on mount if defaults provided
  useEffect(() => {
    if (defaultMake || defaultModel) {
      const initial = [defaultMake, defaultModel].filter(Boolean).join(" ");
      doSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-600">
          Vehicle SRP
        </label>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "lookup" ? "manual" : "lookup");
            setManualError(null);
          }}
          className="text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {mode === "lookup" ? "Enter manually" : "Search database"}
        </button>
      </div>

      {mode === "lookup" ? (
        <div ref={containerRef} className="relative">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => results.length > 0 && setIsOpen(true)}
              placeholder="Search make, model, variant..."
              className="w-full rounded-md border border-gray-200 px-3 py-2 pr-8 text-sm text-neutral-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {isLoading && (
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <svg
                  className="h-4 w-4 animate-spin text-gray-400"
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
            )}
          </div>

          {/* Dropdown results */}
          {isOpen && results.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50"
                  >
                    <span className="font-medium text-neutral-dark">
                      {[item.make, item.model, item.variant]
                        .filter(Boolean)
                        .join(" ")}
                      {item.year_from && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({item.year_from}
                          {item.year_to && item.year_to !== item.year_from
                            ? `–${item.year_to}`
                            : ""}
                          )
                        </span>
                      )}
                    </span>
                    <span className="ml-4 shrink-0 font-semibold text-primary">
                      {formatPeso(item.srp)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isOpen && !isLoading && results.length === 0 && query.trim() && (
            <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-md">
              No results found.{" "}
              <button
                type="button"
                onClick={() => setMode("manual")}
                className="font-medium text-primary underline underline-offset-2"
              >
                Enter SRP manually
              </button>
            </div>
          )}

          {/* Selected state */}
          {selected && (
            <p className="mt-1 text-xs text-gray-500">
              Selected:{" "}
              <span className="font-medium text-neutral-dark">
                {[selected.make, selected.model, selected.variant]
                  .filter(Boolean)
                  .join(" ")}{" "}
                — {formatPeso(selected.srp)}
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                ₱
              </span>
              <input
                type="text"
                value={manualValue}
                onChange={(e) => {
                  setManualValue(e.target.value);
                  setManualError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSubmit();
                }}
                placeholder="0.00"
                className={`w-full rounded-md border py-2 pl-7 pr-3 text-sm text-neutral-dark transition-colors focus:outline-none focus:ring-1 ${
                  manualError
                    ? "border-red-300 focus:border-red-500 focus:ring-red-300"
                    : "border-gray-200 focus:border-primary focus:ring-primary"
                }`}
              />
            </div>
            <button
              type="button"
              onClick={handleManualSubmit}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Apply
            </button>
          </div>
          {manualError && (
            <p className="text-xs text-red-600">{manualError}</p>
          )}
        </div>
      )}
    </div>
  );
}
