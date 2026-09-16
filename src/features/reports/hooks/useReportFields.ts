import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchReportFields } from "@/shared/api/reporting";
import { STALE_TIME } from "@/shared/api/queryClient";
import { isBackendReportCode, resolveReportCode, REPORT_DEFAULT_FIELDS, HIDDEN_REPORT_FIELD_KEYS } from "../constants/reports";
import type { ReportField } from "../types";

interface ReportFieldCatalog {
  fields: ReportField[];
  defaultFields: string[];
}

const COLUMN_SELECTION_STORAGE_KEY = "hr-report-selected-fields";

const readStoredFieldSelections = (): Record<string, string[]> => {
  try {
    const saved = localStorage.getItem(COLUMN_SELECTION_STORAGE_KEY);
    if (!saved) return {};
    const parsed: unknown = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
};

const persistFieldSelection = (code: string, keys: string[]): void => {
  try {
    const all = readStoredFieldSelections();
    localStorage.setItem(COLUMN_SELECTION_STORAGE_KEY, JSON.stringify({ ...all, [code]: keys }));
  } catch {
    // localStorage may be unavailable (e.g. private browsing) — the
    // selection simply won't persist across visits.
  }
};

/** Fetches + caches the selectable field catalog for a report code (null/FE-local code = no catalog). */
export const useReportFields = (code: string | null) => {
  const [selected, setSelected] = useState<string[]>([]);
  const enabled = !!code && isBackendReportCode(code);

  const query = useQuery<ReportFieldCatalog, Error>({
    queryKey: ["reportFields", code],
    queryFn: async () => {
      const result = await fetchReportFields(resolveReportCode(code as string));
      const hidden = new Set(HIDDEN_REPORT_FIELD_KEYS);
      return {
        fields: (result.fields || []).filter((f) => !hidden.has(f.key)),
        defaultFields: (result.default_fields || []).filter((k) => !hidden.has(k)),
      };
    },
    enabled,
    staleTime: STALE_TIME.LONG,
  });

  const fields = enabled ? query.data?.fields ?? [] : [];

  const toggle = useCallback((key: string): void => {
    setSelected((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (code) persistFieldSelection(code, next);
      return next;
    });
  }, [code]);

  const selectAll = useCallback((): void => {
    const next = fields.map((f) => f.key);
    setSelected(next);
    if (code) persistFieldSelection(code, next);
  }, [fields, code]);

  const clearAll = useCallback((): void => {
    setSelected([]);
    if (code) persistFieldSelection(code, []);
  }, [code]);

  // Reset the selection whenever the report code changes (or its catalog
  // resolves): restore the user's last choices for that code from
  // localStorage, falling back to the FE-curated defaults (REPORT_DEFAULT_FIELDS)
  // and then the backend's defaults if they never chose columns before (or
  // every stored key has since been removed from the catalog).
  useEffect(() => {
    if (!enabled) {
      setSelected([]);
      return;
    }
    if (!query.data) return;
    const stored = readStoredFieldSelections()[code as string];
    const validKeys = new Set(query.data.fields.map((f) => f.key));
    if (stored) {
      setSelected(stored.filter((k) => validKeys.has(k)));
    } else {
      const curatedDefaults = REPORT_DEFAULT_FIELDS[resolveReportCode(code as string)];
      const validCuratedDefaults = curatedDefaults?.filter((k) => validKeys.has(k));
      setSelected(validCuratedDefaults?.length ? validCuratedDefaults : query.data.defaultFields);
    }
  }, [enabled, code, query.data]);

  return { fields, selected, toggle, selectAll, clearAll, loading: enabled && query.isFetching };
};
