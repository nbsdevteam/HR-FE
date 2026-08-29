import { useState, useCallback, useEffect } from "react";
import { fetchReportFields } from "@/shared/api/reporting";
import { isBackendReportCode, resolveReportCode } from "../constants/reports";
import type { ReportField } from "../types";

/** Fetches + caches the selectable field catalog for a report code (null/FE-local code = no catalog). */
export const useReportFields = (code: string | null) => {
  const [fields, setFields] = useState<ReportField[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback((key: string): void => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  const selectAll = useCallback((): void => {
    setSelected(fields.map((f) => f.key));
  }, [fields]);

  const clearAll = useCallback((): void => setSelected([]), []);

  useEffect(() => {
    if (!code || !isBackendReportCode(code)) {
      setFields([]);
      setSelected([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchReportFields(resolveReportCode(code))
      .then((result) => {
        if (cancelled) return;
        setFields(result.fields || []);
        setSelected(result.default_fields || []);
      })
      .catch(() => {
        if (!cancelled) {
          setFields([]);
          setSelected([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return { fields, selected, toggle, selectAll, clearAll, loading };
};
