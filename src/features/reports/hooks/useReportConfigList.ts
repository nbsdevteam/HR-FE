import { useState, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DbReportTemplate } from "@/shared/hooks";

/** Search/category/archived-filtered list for the report-configuration admin screen (backend §2.2). */
export const useReportConfigList = () => {
  const [items, setItems] = useState<DbReportTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [includeArchived, setIncludeArchived] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await odooData.fetchReportTemplatesAdmin({
        search: search.trim() || undefined,
        category: category !== "all" ? category : undefined,
        includeArchived,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, category, includeArchived]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    items, total, loading,
    search, setSearch,
    category, setCategory,
    includeArchived, setIncludeArchived,
    refetch,
  };
};
