import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchReportFields } from "@/shared/api/reporting";
import { STALE_TIME } from "@/shared/api/queryClient";
import { isBackendReportCode, resolveReportCode } from "../constants/reports";
import type { ReportField } from "../types";

interface ReportFieldCatalog {
  fields: ReportField[];
  defaultFields: string[];
}

/** Fetches + caches the selectable field catalog for a report code (null/FE-local code = no catalog). */
export const useReportFields = (code: string | null) => {
  const [selected, setSelected] = useState<string[]>([]);
  const enabled = !!code && isBackendReportCode(code);

  const query = useQuery<ReportFieldCatalog, Error>({
    queryKey: ["reportFields", code],
    queryFn: async () => {
      const result = await fetchReportFields(resolveReportCode(code as string));
      return { fields: result.fields || [], defaultFields: result.default_fields || [] };
    },
    enabled,
    staleTime: STALE_TIME.LONG,
  });

  const fields = enabled ? query.data?.fields ?? [] : [];

  const toggle = useCallback((key: string): void => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  const selectAll = useCallback((): void => {
    setSelected(fields.map((f) => f.key));
  }, [fields]);

  const clearAll = useCallback((): void => setSelected([]), []);

  // Reset the selection to the catalog's defaults whenever the report code
  // changes (or its catalog resolves) — mirrors the previous effect-per-code
  // behavior, but also fires on a cache hit since `query.data` is available
  // immediately instead of only on a fresh fetch.
  useEffect(() => {
    if (!enabled) {
      setSelected([]);
      return;
    }
    if (query.data) setSelected(query.data.defaultFields);
  }, [enabled, query.data]);

  return { fields, selected, toggle, selectAll, clearAll, loading: enabled && query.isFetching };
};
