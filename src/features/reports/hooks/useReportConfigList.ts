import { useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import { useAppLanguage } from "@/i18n/useLocalizedName";
import { useCachedList, type DbReportTemplate } from "@/shared/hooks";

interface ReportConfigListResult {
  items: DbReportTemplate[];
  total: number;
}

/** Search/category/archived-filtered list for the report-configuration admin screen (backend §2.2). Descriptions/column labels come back in the active app language; the edit form reloads its own template without `lang` (see `useReportConfigForm`) so it never seeds English inputs from this localized list. */
export const useReportConfigList = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [includeArchived, setIncludeArchived] = useState(false);
  const lang = useAppLanguage();

  const { data, loading, refetch } = useCachedList<ReportConfigListResult>(
    "reportConfigList",
    async () => [
      await odooData.fetchReportTemplatesAdmin({
        search: search.trim() || undefined,
        category: category !== "all" ? category : undefined,
        includeArchived,
        lang,
      }),
    ],
    "Failed to load report templates",
    [search, category, includeArchived, lang],
    true,
    { ttlMs: STALE_TIME.LONG },
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
