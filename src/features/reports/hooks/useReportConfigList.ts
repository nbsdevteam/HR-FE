import { useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { useCachedList, type DbReportTemplate } from "@/shared/hooks";

interface ReportConfigListResult {
  items: DbReportTemplate[];
  total: number;
}

/** Search/category/archived-filtered list for the report-configuration admin screen (backend §2.2). */
export const useReportConfigList = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data, loading, refetch } = useCachedList<ReportConfigListResult>(
    "reportConfigList",
    async () => [
      await odooData.fetchReportTemplatesAdmin({
        search: search.trim() || undefined,
        category: category !== "all" ? category : undefined,
        includeArchived,
      }),
    ],
    "Failed to load report templates",
    [search, category, includeArchived],
  );

  return {
    items: data[0]?.items ?? [],
    total: data[0]?.total ?? 0,
    loading,
    search, setSearch,
    category, setCategory,
    includeArchived, setIncludeArchived,
    refetch,
  };
};
