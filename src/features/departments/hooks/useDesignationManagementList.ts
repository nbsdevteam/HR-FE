import { useState, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DbPosition } from "@/shared/hooks";

/** `include_archived`-filtered job-title list for the org-structure admin screen (backend §1). */
export const useDesignationManagementList = () => {
  const [items, setItems] = useState<DbPosition[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await odooData.fetchDesignationsAdmin({ includeArchived });
      setItems(result.items);
      setTotal(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, total, loading, includeArchived, setIncludeArchived, refetch };
};
